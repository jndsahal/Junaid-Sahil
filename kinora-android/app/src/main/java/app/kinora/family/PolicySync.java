package app.kinora.family;

import android.app.*;
import android.app.admin.*;
import android.app.usage.*;
import android.content.*;
import android.content.pm.*;
import android.provider.Settings;
import android.telecom.TelecomManager;
import org.json.*;
import java.util.*;

final class PolicySync {
    static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("connection",Context.MODE_PRIVATE);}
    static boolean managed(Context c){return ((DevicePolicyManager)c.getSystemService(Context.DEVICE_POLICY_SERVICE)).isDeviceOwnerApp(c.getPackageName());}
    static ComponentName admin(Context c){return new ComponentName(c,KinoraAdmin.class);}
    static Set<String> protectedPackages(Context c){
        Set<String> result=new HashSet<>(Arrays.asList(c.getPackageName(),"com.android.settings","com.android.systemui","com.android.phone"));
        TelecomManager tm=(TelecomManager)c.getSystemService(Context.TELECOM_SERVICE);if(tm.getDefaultDialerPackage()!=null)result.add(tm.getDefaultDialerPackage());
        ResolveInfo home=c.getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),PackageManager.MATCH_DEFAULT_ONLY);if(home!=null)result.add(home.activityInfo.packageName);
        String accessibility=Settings.Secure.getString(c.getContentResolver(),Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if(accessibility!=null)for(String part:accessibility.split(":")){ComponentName component=ComponentName.unflattenFromString(part);if(component!=null)result.add(component.getPackageName());}
        return result;
    }
    static String enforce(Context c,String pkg,boolean block){
        if(!managed(c))return "unsupported";
        try {
            ApplicationInfo info=c.getPackageManager().getApplicationInfo(pkg,0);
            if(block&&(protectedPackages(c).contains(pkg)||(info.flags&(ApplicationInfo.FLAG_SYSTEM|ApplicationInfo.FLAG_UPDATED_SYSTEM_APP))!=0))return "failed";
            Set<String> ours=new HashSet<>(prefs(c).getStringSet("suspended",Collections.emptySet()));
            if(!block&&!ours.contains(pkg))return "applied";
            // Persist intent before the platform call so a crash can still be cleaned up.
            if(block){ours.add(pkg);prefs(c).edit().putStringSet("suspended",ours).commit();}
            String[] failed=((DevicePolicyManager)c.getSystemService(Context.DEVICE_POLICY_SERVICE)).setPackagesSuspended(admin(c),new String[]{pkg},block);
            if(failed.length!=0)return "failed";
            if(!block){ours.remove(pkg);prefs(c).edit().putStringSet("suspended",ours).commit();}
            return "applied";
        } catch(Exception e){return "failed";}
    }
    static synchronized void disconnect(Context c){
        for(String pkg:new HashSet<>(prefs(c).getStringSet("suspended",Collections.emptySet())))enforce(c,pkg,false);
        if(managed(c))try{((DevicePolicyManager)c.getSystemService(Context.DEVICE_POLICY_SERVICE)).clearDeviceOwnerApp(c.getPackageName());}catch(Exception ignored){}
        prefs(c).edit().remove("token").remove("did").apply();
        ((android.app.job.JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE)).cancel(1201);
    }
    static synchronized JSONObject run(Context c) throws Exception {
        String base=prefs(c).getString("base",""),token=prefs(c).getString("token",""),did=prefs(c).getString("did","");
        if(token.isEmpty())return new JSONObject().put("managed",managed(c));
        String root="/devices/"+did;
        JSONObject policy;
        try{policy=Remote.request(base,token,"GET",root+"/policy",null);}catch(Remote.Failure e){if(e.status==401||e.status==404)disconnect(c);throw e;}
        Map<String,Boolean> desired=new HashMap<>();JSONArray apps=policy.getJSONArray("apps");
        for(int i=0;i<apps.length();i++){JSONObject a=apps.getJSONObject(i);desired.put(a.getString("package"),a.getInt("blocked")==1);}
        Map<String,String> results=new HashMap<>();
        for(String pkg:new HashSet<>(prefs(c).getStringSet("suspended",Collections.emptySet())))if(!desired.getOrDefault(pkg,false))enforce(c,pkg,false);
        for(Map.Entry<String,Boolean> entry:desired.entrySet())results.put(entry.getKey(),enforce(c,entry.getKey(),entry.getValue()));
        JSONArray commands=Remote.request(base,token,"GET",root+"/commands",null).getJSONArray("commands");
        for(int i=0;i<commands.length();i++){
            JSONObject command=commands.getJSONObject(i);if(!command.getString("state").equals("pending"))continue;
            String pkg=command.getString("package");boolean block=command.getString("action").equals("block");
            if(!desired.containsKey(pkg)||desired.get(pkg)!=block)continue;
            String state=results.getOrDefault(pkg,"failed");
            try{Remote.request(base,token,"POST",root+"/commands/"+command.getString("id")+"/ack",new JSONObject().put("state",state).put("detail",state.equals("unsupported")?"Device Owner enrollment is required":state.equals("failed")?"Protected, missing or unsupported app":"Android policy applied"));}
            catch(Remote.Failure e){if(e.status!=409)throw e;}
        }
        // Inventory and usage refresh at most once per minute. Location is a separate opt-in report.
        if(System.currentTimeMillis()-prefs(c).getLong("reported",0)>60000){
            Remote.request(base,token,"POST",root+"/telemetry",report(c));prefs(c).edit().putLong("reported",System.currentTimeMillis()).apply();
        }
        return new JSONObject().put("managed",managed(c));
    }
    static JSONObject report(Context c) throws Exception {
        boolean usage=((AppOpsManager)c.getSystemService(Context.APP_OPS_SERVICE)).checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,android.os.Process.myUid(),c.getPackageName())==AppOpsManager.MODE_ALLOWED;
        Map<String,UsageStats> stats=Collections.emptyMap();
        if(usage){Calendar start=Calendar.getInstance();start.set(Calendar.HOUR_OF_DAY,0);start.set(Calendar.MINUTE,0);start.set(Calendar.SECOND,0);start.set(Calendar.MILLISECOND,0);stats=((UsageStatsManager)c.getSystemService(Context.USAGE_STATS_SERVICE)).queryAndAggregateUsageStats(start.getTimeInMillis(),System.currentTimeMillis());}
        JSONArray apps=new JSONArray();Set<String> seen=new HashSet<>();
        for(ResolveInfo info:c.getPackageManager().queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0)){
            String pkg=info.activityInfo.packageName;if(!seen.add(pkg)||apps.length()>=250)continue;
            ApplicationInfo app=info.activityInfo.applicationInfo;
            if(protectedPackages(c).contains(pkg)||(app.flags&(ApplicationInfo.FLAG_SYSTEM|ApplicationInfo.FLAG_UPDATED_SYSTEM_APP))!=0)continue;
            UsageStats s=stats.get(pkg);String label=info.loadLabel(c.getPackageManager()).toString();if(label.length()>100)label=label.substring(0,100);
            apps.put(new JSONObject().put("package",pkg).put("name",label).put("minutes",s==null?0:Math.min(10080,s.getTotalTimeInForeground()/60000)));
        }
        return new JSONObject().put("apps",apps).put("managed",managed(c)).put("usageEnabled",usage);
    }
}

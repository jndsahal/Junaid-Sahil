package app.kinora.family;

import android.Manifest;
import android.app.*;
import android.app.job.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.util.*;

public class FamilyActivity extends Activity {
    private WebView web;
    private String base;
    private boolean paused=false;
    private boolean blanked=false;
    private PermissionRequest cameraPermission;
    private GeolocationPermissions.Callback locationPermission;
    private String locationOrigin;
    private boolean sameOrigin(Uri uri){
        Uri trusted=Uri.parse(base);
        return "https".equals(uri.getScheme())&&Objects.equals(uri.getHost(),trusted.getHost())&&uri.getPort()==trusted.getPort();
    }
    @Override public void onCreate(Bundle state){
        super.onCreate(state);base=PolicySync.prefs(this).getString("base","");
        if(base.isEmpty())setup();else open();
    }
    private void setup(){
        LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setPadding(32,64,32,32);
        TextView title=new TextView(this);title.setText("Connect Kinora\n\nEnter the HTTPS address of your family's Kinora server. Only use a server you control and trust.");title.setTextSize(20);root.addView(title);
        EditText input=new EditText(this);input.setHint("https://kinora.example.com");input.setInputType(17);root.addView(input);
        Button connect=new Button(this);connect.setText("Connect to server");root.addView(connect);setContentView(root);
        connect.setOnClickListener(v->{
            try{Uri uri=Uri.parse(input.getText().toString().trim());if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null||!(uri.getPath()==null||uri.getPath().isEmpty()||uri.getPath().equals("/")))throw new IllegalArgumentException();
                base="https://"+uri.getEncodedAuthority();PolicySync.prefs(this).edit().putString("base",base).apply();open();
            }catch(Exception e){input.setError("Enter an HTTPS origin without a path, query or credentials");}
        });
    }
    @SuppressWarnings("SetJavaScriptEnabled") private void open(){
        web=new WebView(this);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new Bridge(),"Kinora");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !sameOrigin(request.getUrl());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                if(!sameOrigin(request.getUrl()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){
                if(paused||!sameOrigin(request.getOrigin())||!Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)){request.deny();return;}
                if(cameraPermission!=null)cameraPermission.deny();cameraPermission=request;
                if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED){request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});cameraPermission=null;}
                else requestPermissions(new String[]{Manifest.permission.CAMERA},51);
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request){if(cameraPermission==request)cameraPermission=null;}
            @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){
                if(paused||!sameOrigin(Uri.parse(origin))){callback.invoke(origin,false,false);return;}
                locationPermission=callback;locationOrigin=origin;
                if(checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED){callback.invoke(origin,true,false);locationPermission=null;}
                else requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},52);
            }
        });
        LinearLayout layout=new LinearLayout(this);layout.setOrientation(1);
        Button recovery=new Button(this);recovery.setText("Connection settings / disconnect");layout.addView(recovery);
        recovery.setOnClickListener(v->new AlertDialog.Builder(this).setTitle("Disconnect Kinora?").setMessage("Release app blocks and remove this phone's saved connection. This also works when the server is offline.").setNegativeButton("Cancel",null).setPositiveButton("Disconnect",(dialog,which)->{
            String token=PolicySync.prefs(this).getString("token",""),did=PolicySync.prefs(this).getString("did","");String oldBase=base;
            web.evaluateJavascript("window.kinoraStop && window.kinoraStop(); sessionStorage.clear()",null);
            web.removeJavascriptInterface("Kinora");web.destroy();web=null;WebStorage.getInstance().deleteAllData();recovery.setEnabled(false);
            new Thread(()->{PolicySync.disconnect(this);PolicySync.prefs(this).edit().remove("base").apply();runOnUiThread(()->{if(!isFinishing())setup();});if(!token.isEmpty())try{Remote.request(oldBase,token,"DELETE","/devices/"+did,null);}catch(Exception ignored){}},"kinora-revoke").start();
        }).show());
        layout.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(layout);
        web.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        web.loadUrl(base+"/ui");
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){
        super.onRequestPermissionsResult(code,permissions,results);
        if(code==51&&cameraPermission!=null){if(!paused&&checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)cameraPermission.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else cameraPermission.deny();cameraPermission=null;}
        if(code==52&&locationPermission!=null){locationPermission.invoke(locationOrigin,!paused&&checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED,false);locationPermission=null;}
    }
    @Override public void onPause(){
        super.onPause();paused=true;
        if(web!=null)web.evaluateJavascript("window.kinoraStop && window.kinoraStop()",null);
        if(web!=null&&cameraPermission==null&&locationPermission==null){web.loadUrl("about:blank");web.onPause();blanked=true;}
    }
    @Override public void onResume(){super.onResume();paused=false;if(blanked&&web!=null){blanked=false;web.onResume();web.loadUrl(base+"/ui");}}
    @Override public void onDestroy(){if(web!=null){web.removeJavascriptInterface("Kinora");web.destroy();web=null;}super.onDestroy();}
    private static String error(Exception e){try{return new JSONObject().put("error",e.getMessage()==null?"Connection failed":e.getMessage()).toString();}catch(Exception ignored){return "{}";}}
    final class Bridge {
        @JavascriptInterface public String credentials(){try{return new JSONObject().put("token",PolicySync.prefs(FamilyActivity.this).getString("token","")).put("did",PolicySync.prefs(FamilyActivity.this).getString("did","")).toString();}catch(Exception e){return error(e);}}
        @JavascriptInterface public String enroll(String token,String did){
            try{
                if(token.length()>100||!did.matches("[a-f0-9]{32}"))throw new Exception("Invalid device credentials");
                Remote.request(base,token,"GET","/devices/"+did+"/policy",null);
                PolicySync.prefs(FamilyActivity.this).edit().putString("token",token).putString("did",did).putLong("reported",0).commit();
                JobInfo job=new JobInfo.Builder(1201,new ComponentName(FamilyActivity.this,SyncJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(15*60*1000).build();
                ((JobScheduler)getSystemService(JOB_SCHEDULER_SERVICE)).schedule(job);
                return PolicySync.run(FamilyActivity.this).toString();
            }catch(Exception e){return error(e);}
        }
        @JavascriptInterface public String sync(){try{return PolicySync.run(FamilyActivity.this).toString();}catch(Exception e){return error(e);}}
        @JavascriptInterface public void disconnect(){PolicySync.disconnect(FamilyActivity.this);}
    }
}

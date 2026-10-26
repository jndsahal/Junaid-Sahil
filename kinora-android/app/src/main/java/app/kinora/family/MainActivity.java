package app.kinora.family;

import android.app.*;
import android.app.usage.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
    private LinearLayout root;
    private android.content.SharedPreferences prefs;
    private final int ink = Color.rgb(25, 39, 49), teal = Color.rgb(21, 116, 105);
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences("kinora", MODE_PRIVATE);
    }
    @Override public void onResume() { super.onResume(); home(); }
    private int dp(int n) { return (int)(n * getResources().getDisplayMetrics().density); }
    private void text(String value, int size, boolean bold) {
        TextView v = new TextView(this);
        v.setText(value); v.setTextSize(size); v.setTextColor(ink);
        if (bold) v.setTypeface(null, Typeface.BOLD);
        v.setPadding(0, dp(10), 0, dp(10)); root.addView(v);
    }
    private void button(String title, Runnable action) {
        Button b = new Button(this); b.setText(title); b.setAllCaps(false);
        b.setTextColor(Color.WHITE);
        GradientDrawable bg = new GradientDrawable(); bg.setColor(teal); bg.setCornerRadius(dp(16));
        b.setBackground(bg);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, dp(54));
        p.setMargins(0,dp(8),0,dp(8)); root.addView(b,p);
        b.setOnClickListener(v -> action.run());
    }
    private void home() {
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(245,248,245));
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(24),dp(24),dp(24),dp(32)); scroll.addView(root);
        setContentView(scroll);
        scroll.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        text("KINORA", 16, true);
        text("A little balance.\nMore family time.", 32, true);
        text("Android foundation • on-device only", 14, false);
        String role = prefs.getString("role", "");
        if (role.isEmpty()) {
            text("Who is using this phone?", 21, true);
            text("Choose a mode. Usage access is optional and can be revoked in Android settings.",16,false);
            button("I am a parent", () -> choose("parent"));
            button("This is a child’s device", () -> choose("child"));
            return;
        }
        text(role.equals("parent") ? "Your family dashboard" : "Your daily balance",24,true);
        if (role.equals("parent")) {
            text("No child devices connected",20,true);
            text("Secure cross-device pairing and remote reports are not connected in this first build. No child data is shown or uploaded.",16,false);
        }
        text("This phone’s usage",21,true);
        if (!hasUsageAccess()) {
            text("Allow usage access to view foreground app activity on this phone. Data stays on this device.",16,false);
            button("Open usage access settings", () -> startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)));
        } else {
            showUsage();
            button("Refresh usage", this::home);
            button("Manage usage permission", () -> startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)));
        }
        int goal = prefs.getInt("goal",120);
        text("Daily goal: " + goal + " minutes",20,true);
        text("A personal goal only. This build does not block apps or send background alerts.",14,false);
        button("Change daily goal", () -> {
            EditText input = new EditText(this); input.setInputType(2); input.setText(String.valueOf(goal));
            AlertDialog dialog = new AlertDialog.Builder(this).setTitle("Daily goal (1–1440 minutes)")
                .setView(input).setPositiveButton("Save",null).setNegativeButton("Cancel",null).create();
            dialog.setOnShowListener(d -> dialog.getButton(-1).setOnClickListener(v -> {
                try {
                    int value = Integer.parseInt(input.getText().toString());
                    if(value<1 || value>1440) throw new NumberFormatException();
                    prefs.edit().putInt("goal",value).apply(); dialog.dismiss(); home();
                } catch(NumberFormatException e) { input.setError("Enter 1 to 1440"); }
            })); dialog.show();
        });
        button("Change device mode", () -> { prefs.edit().remove("role").apply(); home(); });
        button("Erase Kinora settings", () -> new AlertDialog.Builder(this)
            .setTitle("Erase local settings?").setMessage("Your selected mode and daily goal will be deleted. Android usage history and permissions are managed in system settings.")
            .setPositiveButton("Erase",(d,w) -> { prefs.edit().clear().apply(); home(); })
            .setNegativeButton("Cancel",null).show());
    }
    private void choose(String mode) { prefs.edit().putString("role",mode).apply(); home(); }
    private boolean hasUsageAccess() {
        AppOpsManager ops=(AppOpsManager)getSystemService(APP_OPS_SERVICE);
        return ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,android.os.Process.myUid(),getPackageName())==AppOpsManager.MODE_ALLOWED;
    }
    private void showUsage() {
        Calendar start=Calendar.getInstance();
        start.set(Calendar.HOUR_OF_DAY,0); start.set(Calendar.MINUTE,0);
        start.set(Calendar.SECOND,0); start.set(Calendar.MILLISECOND,0);
        UsageStatsManager manager=(UsageStatsManager)getSystemService(USAGE_STATS_SERVICE);
        Map<String,UsageStats> stats=manager.queryAndAggregateUsageStats(start.getTimeInMillis(),System.currentTimeMillis());
        List<UsageStats> rows=new ArrayList<>(stats.values());
        rows.sort((a,b)->Long.compare(b.getTotalTimeInForeground(),a.getTotalTimeInForeground()));
        text("Android usage estimate",18,true);
        text("System aggregate buckets can extend beyond midnight. App totals may overlap in multi-window mode; this is not exact screen-on time.",13,false);
        int count=0;
        for(UsageStats item:rows) {
            long minutes=item.getTotalTimeInForeground()/60000;
            if(minutes==0) continue;
            String label=item.getPackageName();
            try { label=getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(label,0)).toString(); }
            catch(android.content.pm.PackageManager.NameNotFoundException ignored) {}
            text(label+"  ·  "+minutes+" min",16,false);
            if(++count==10) break;
        }
        if(count==0) text("No activity available yet. Use a few apps and refresh.",16,false);
    }
}

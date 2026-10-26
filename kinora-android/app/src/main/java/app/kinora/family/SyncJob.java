package app.kinora.family;
import android.app.job.*;
public class SyncJob extends JobService {
    @Override public boolean onStartJob(JobParameters params){new Thread(()->{boolean retry=false;try{PolicySync.run(this);}catch(Exception e){retry=true;}jobFinished(params,retry);},"kinora-sync").start();return true;}
    @Override public boolean onStopJob(JobParameters params){return true;}
}

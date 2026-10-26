package app.kinora.family;

import org.json.*;
import java.net.*;
import java.io.*;
import javax.net.ssl.HttpsURLConnection;

final class Remote {
    static class Failure extends IOException { final int status; Failure(int s,String m){super(m);status=s;} }
    static JSONObject request(String base,String token,String method,String path,JSONObject body) throws Exception {
        HttpsURLConnection c=(HttpsURLConnection)new URL(base+path).openConnection();
        c.setConnectTimeout(8000);c.setReadTimeout(8000);c.setInstanceFollowRedirects(false);
        c.setRequestMethod(method);c.setRequestProperty("Authorization","Bearer "+token);
        c.setRequestProperty("Content-Type","application/json");
        try {
            if(body!=null){c.setDoOutput(true);try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));}}
            int code=c.getResponseCode();InputStream in=code<400?c.getInputStream():c.getErrorStream();
            String value="{}";
            if(in!=null){try(InputStream input=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buffer=new byte[4096];int n,total=0;while((n=input.read(buffer))!=-1){total+=n;if(total>500000)throw new IOException("Response too large");out.write(buffer,0,n);}value=out.toString("UTF-8");}}
            JSONObject result=new JSONObject(value);
            if(code<200||code>=300)throw new Failure(code,result.optString("error","Server request failed"));return result;
        } finally {c.disconnect();}
    }
}

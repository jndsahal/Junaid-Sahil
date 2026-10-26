"""Dependency-free development APK build using Android SDK 35 and JDK 17.
Not a production signing workflow. Keeps the generated test key under build/.
"""
import os
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

root=Path(__file__).resolve().parent
sdk=Path(os.environ['ANDROID_HOME'])
jdk=Path(os.environ['JAVA_HOME'])
tools=sdk/'build-tools/35.0.0'
android=sdk/'platforms/android-35/android.jar'
build=root/'build/manual'
for name in ('gen','classes','dex'): (build/name).mkdir(parents=True,exist_ok=True)
def run(*args): subprocess.run([str(a) for a in args],check=True,cwd=root)
ns='http://schemas.android.com/apk/res/android';ET.register_namespace('android',ns)
tree=ET.parse(root/'app/src/main/AndroidManifest.xml');manifest=tree.getroot()
manifest.set('package','app.kinora.family');manifest.set('{'+ns+'}versionCode','2');manifest.set('{'+ns+'}versionName','0.2.0')
manifest.insert(0,ET.Element('uses-sdk',{'{'+ns+'}minSdkVersion':'26','{'+ns+'}targetSdkVersion':'35'}))
tree.write(build/'AndroidManifest.xml',encoding='utf-8',xml_declaration=True)
run(tools/'aapt2','compile','--dir',root/'app/src/main/res','-o',build/'resources.zip')
run(tools/'aapt2','link','-o',build/'unsigned.apk','-I',android,'--manifest',build/'AndroidManifest.xml','--java',build/'gen',build/'resources.zip')
sources=list((root/'app/src/main/java').rglob('*.java'))+list((build/'gen').rglob('*.java'))
run(jdk/'bin/javac','-source','17','-target','17','-classpath',android,'-d',build/'classes',*sources)
run(tools/'d8','--lib',android,'--min-api','26','--output',build/'dex',*(build/'classes').rglob('*.class'))
with zipfile.ZipFile(build/'unsigned.apk','a') as archive:
    for dex in (build/'dex').glob('*.dex'): archive.write(dex,dex.name)
run(tools/'zipalign','-f','4',build/'unsigned.apk',build/'aligned.apk')
key=build/'debug.jks'
if not key.exists():
    run(jdk/'bin/keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','androiddebugkey','-dname','CN=Kinora Development','-keyalg','RSA','-validity','3650')
run(tools/'apksigner','sign','--ks',key,'--ks-pass','pass:android','--out',build/'Kinora-0.2.0-debug.apk',build/'aligned.apk')
run(tools/'apksigner','verify','--verbose',build/'Kinora-0.2.0-debug.apk')
print(build/'Kinora-0.2.0-debug.apk')

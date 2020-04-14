# Building nginx + RTMP Module

## Prerequisites
Install a reasonable build toolchain. On Debian/Ubuntu:

```shell
apt -y install build-essential automake autoconf byacc libtool cmake bison
```

Install needed dependencies to build:

```shell
apt -y install libpcre3-dev libz-dev libssl-dev
```

## Building
First, grab and unpack nginx:

```shell
wget "http://nginx.org/download/nginx-1.16.1.tar.gz"
tar xf nginx-1.16.1.tar.gz && rm nginx-1.16.1.tar.gz
cd nginx-1.16.1
```

Grab and unpack LibreSSL and the RTMP Module:

```shell
wget "https://ftp.openbsd.org/pub/OpenBSD/LibreSSL/libressl-3.0.2.tar.gz"
tar xf libressl-3.0.2.tar.gz
wget "https://github.com/arut/nginx-rtmp-module/archive/v1.2.1.tar.gz"
tar xf v1.2.1.tar.gz
```

Configure, build and install nginx with modules:

```shell
CFLAGS="-fPIC" ./configure --with-pcre-jit --with-http_ssl_module --with-http_realip_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_v2_module --with-http_flv_module --with-http_mp4_module --with-threads --with-cc-opt=" -fPIC " --with-ld-opt=" -pie " --with-openssl="$(pwd)/libressl-3.0.2" --add-module="$(pwd)/nginx-rtmp-module-1.2.1"
CFLAGS="-fPIC" make -j4
make install
cd ..
rm -rf nginx-1.16.1
```

It's now installed!

## Quick Configuration
nginx by default is self-contained in `/usr/local/nginx`. Normally, on Debian
an nginx server would be configured via `/etc/nginx`. Let's set that back up
and create the usual log directory:

```shell
mkdir /etc/nginx
rm -rf /usr/local/nginx/conf
ln -s /etc/nginx /usr/local/nginx/conf
mkdir -p /var/log/nginx
```

The next step may take a while to complete, but it is needed for OpenSSL:

```shell
openssl dhparam -out /etc/nginx/dhparam.pem 3072 >/dev/null 2>&1
```

Now to set up a basic `nginx.conf`. Just copy and paste this entire block:

```shell
cat << 'EOF' > /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
worker_rlimit_nofile 8192;

events {
    worker_connections 8000;
    multi_accept on;
}

http {
    default_type application/octet-stream;

    access_log off;

    # Edit this to prevent wide open access.
    add_header "Access-Control-Allow-Origin" "*";
    # Request 3rd parties do not manipulate content.
    add_header "Cache-Control" "no-transform";
    # MIME type sniffing security protection.
    add_header "X-Content-Type-Options" "nosniff";
    # Prevent rendering within 3rd party a frame or iframe.
    add_header "X-Frame-Options" "SAMEORIGIN";
    # Force the latest IE version.
    add_header "X-UA-Compatible" "IE=Edge";
    # Instructs IE to enable its inbuilt anti-cross-site scripting filter.
    add_header "X-XSS-Protection" "1; mode=block";

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
mkdir /etc/nginx/sites-available && mkdir /etc/nginx/sites-enabled
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen *:80;
    server_name _;
    location / {
        deny all;
    }
}
EOF
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled
cat << 'EOF' > /etc/nginx/fastcgi_params
fastcgi_param  QUERY_STRING       $query_string;
fastcgi_param  REQUEST_METHOD     $request_method;
fastcgi_param  CONTENT_TYPE       $content_type;
fastcgi_param  CONTENT_LENGTH     $content_length;
fastcgi_param  SCRIPT_NAME        $fastcgi_script_name;
fastcgi_param  REQUEST_URI        $request_uri;
fastcgi_param  DOCUMENT_URI       $document_uri;
fastcgi_param  DOCUMENT_ROOT      $document_root;
fastcgi_param  SERVER_PROTOCOL    $server_protocol;
fastcgi_param  REQUEST_SCHEME     $scheme;
fastcgi_param  HTTPS              $https if_not_empty;
fastcgi_param  GATEWAY_INTERFACE  CGI/1.1;
fastcgi_param  SERVER_SOFTWARE    nginx/$nginx_version;
fastcgi_param  REMOTE_ADDR        $remote_addr;
fastcgi_param  REMOTE_PORT        $remote_port;
fastcgi_param  SERVER_ADDR        $server_addr;
fastcgi_param  SERVER_PORT        $server_port;
fastcgi_param  SERVER_NAME        $server_name;
# PHP only, required if PHP was built with --enable-force-cgi-redirect
fastcgi_param  REDIRECT_STATUS    200;
EOF
cat << 'EOF' > /etc/nginx/mime.types
types {
    text/html                             html htm shtml;
    text/css                              css;
    text/xml                              xml;
    image/gif                             gif;
    image/jpeg                            jpeg jpg;
    application/javascript                js;
    application/atom+xml                  atom;
    application/rss+xml                   rss;
    text/mathml                           mml;
    text/plain                            txt;
    text/vnd.sun.j2me.app-descriptor      jad;
    text/vnd.wap.wml                      wml;
    text/x-component                      htc;
    image/png                             png;
    image/tiff                            tif tiff;
    image/vnd.wap.wbmp                    wbmp;
    image/x-icon                          ico;
    image/x-jng                           jng;
    image/x-ms-bmp                        bmp;
    image/svg+xml                         svg svgz;
    image/webp                            webp;
    application/font-woff                 woff;
    application/java-archive              jar war ear;
    application/json                      json;
    application/mac-binhex40              hqx;
    application/msword                    doc;
    application/pdf                       pdf;
    application/postscript                ps eps ai;
    application/rtf                       rtf;
    application/vnd.apple.mpegurl         m3u8;
    application/vnd.ms-excel              xls;
    application/vnd.ms-fontobject         eot;
    application/vnd.ms-powerpoint         ppt;
    application/vnd.wap.wmlc              wmlc;
    application/vnd.google-earth.kml+xml  kml;
    application/vnd.google-earth.kmz      kmz;
    application/x-7z-compressed           7z;
    application/x-cocoa                   cco;
    application/x-java-archive-diff       jardiff;
    application/x-java-jnlp-file          jnlp;
    application/x-makeself                run;
    application/x-perl                    pl pm;
    application/x-pilot                   prc pdb;
    application/x-rar-compressed          rar;
    application/x-redhat-package-manager  rpm;
    application/x-sea                     sea;
    application/x-shockwave-flash         swf;
    application/x-stuffit                 sit;
    application/x-tcl                     tcl tk;
    application/x-x509-ca-cert            der pem crt;
    application/x-xpinstall               xpi;
    application/xhtml+xml                 xhtml;
    application/xspf+xml                  xspf;
    application/zip                       zip;
    application/octet-stream              bin exe dll;
    application/octet-stream              deb;
    application/octet-stream              dmg;
    application/octet-stream              iso img;
    application/octet-stream              msi msp msm;
    application/vnd.openxmlformats-officedocument.wordprocessingml.document    docx;
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet          xlsx;
    application/vnd.openxmlformats-officedocument.presentationml.presentation  pptx;
    audio/midi                            mid midi kar;
    audio/mpeg                            mp3;
    audio/ogg                             ogg;
    audio/x-m4a                           m4a;
    audio/x-realaudio                     ra;
    video/3gpp                            3gpp 3gp;
    video/mp2t                            ts;
    video/mp4                             mp4;
    video/mpeg                            mpeg mpg;
    video/quicktime                       mov;
    video/webm                            webm;
    video/x-flv                           flv;
    video/x-m4v                           m4v;
    video/x-mng                           mng;
    video/x-ms-asf                        asx asf;
    video/x-ms-wmv                        wmv;
    video/x-msvideo                       avi;
}
EOF
```

Done! You may now launch the server via the `nginx` command.

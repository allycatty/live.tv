# live.tv
> A simple live streaming setup.

This is a no-frills live-streaming setup with a volume control, fullscreen
button and an automatic sync function that ensures viewers will be watching
roughly the same thing at the same time.

## Requirements
* [nginx][0] + [nginx-rtmp-module][1] installed
* node.js to build the client page
* ffmpeg to act as a stream client

See [BUILDING.md][5] for nginx + nginx-rtmp-module build instructions.

## nginx Setup
Create an HLS temp directory: `mkdir -p /tmp/live.tv/hls`.

Add this to your main `nginx.conf` above the http{} block:

```
rtmp {
    server {
        listen 127.0.0.1:1935;
        chunk_size 4096;

        application show {
            live on;

            hls on;
            hls_path /tmp/live.tv/hls;

            hls_fragment 3s;
            hls_fragment_naming system;

            allow publish 127.0.0.1;
            deny publish all;
            deny play all;
        }
    }
}
```

Be sure to edit `hls_path` to point to the correct HLS temp directory!

Make a vhost that looks something like the following. Replace `live.tv` with a
domain of your choice:

```
server {
    listen *:80;
    server_name live.tv www.live.tv;
    return 301 https://$host$request_uri;
}

server {
    listen *:443 ssl;
    server_name live.tv www.live.tv;
    root /web/live.tv/;

    ssl_certificate /etc/ssl/certs/live.tv.crt;
    ssl_certificate_key /etc/ssl/private/live.tv.key;
    add_header Strict-Transport-Security "max-age=31536000;";

    location / {
        auth_basic "ask a friend for the login!";
        auth_basic_user_file live.tv.htpasswd;
        index index.html;
        gzip on;
    }

    location /hls {
        root /tmp/live.tv;
        add_header Cache-Control no-store;
        open_file_cache off;
        types {
            application/x-mpegurl m3u8;
            video/mp2t ts;
        }
    }

    location /sync {
        return 200 $msec;
    }
}
```

## Client Setup
Edit `client/pages/index/root.js` and change `https://live.tv/hls/stream.m3u8`
to an appropriate URL.

Build the client page with npm:

`npm i && npm run build`

Copy the `index.html` files inside `deploy/client` to the webroot on the server.

## ffmpeg Streaming
Try adding the following to your .profile. Remember to change `live.tv`!

```
stream() {
    echo "$@" > /web/live.tv/title
    ffmpeg -re -i "$@" \
    -c:a aac -ac 2 -ar 48000 -b:a 192k \
    -c:v libx264 -bsf:v h264_mp4toannexb -profile:v high \
    -pix_fmt yuv420p -maxrate 2500k -bufsize 5000k \
    -force_key_frames "expr:gte(t,n_forced*3)" \
    -err_detect ignore_err -ignore_unknown \
    -f flv rtmp://localhost/show/stream
}
```

Then from the server you can play files via `stream <path to file>`.

You may also provide additional flags. The following example will select the
default video track, as well as any track with metadata tagging it as English
language:

`stream <file> -map 0:v:0 -map 0:m:language:eng`

## Updating .htpasswd
```
streampw() {
        PASS=$(openssl passwd -apr1 "$2")
        echo "$1:$PASS" > /etc/nginx/live.tv.htpasswd
}
```

Use as `streampw user password`.

## Thanks
[nop-sled][1]

## License
[0BSD][2]

The [hls.js][3] library and [Material Design][6] icons are both covered under
the [Apache 2.0][4] license.

[0]: http://nginx.org/
[1]: https://github.com/arut/nginx-rtmp-module
[2]: https://opensource.org/licenses/0BSD
[3]: https://github.com/video-dev/hls.js
[4]: https://opensource.org/licenses/Apache-2.0
[5]: https://github.com/AequoreaVictoria/live.tv/blob/master/BUILDING.md
[6]: https://material.io/resources/icons/?style=baseline
[7]: https://github.com/nop-sled

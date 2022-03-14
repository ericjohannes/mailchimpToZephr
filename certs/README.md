These certs just for testing on local machine.
Created follwed https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/

what I did
```eblom@C02G70JCMD6Q certs % openssl req -new -key key.pem -out csr.pem
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) []:US
State or Province Name (full name) []:.
Locality Name (eg, city) []:.
Organization Name (eg, company) []:.
Organizational Unit Name (eg, section) []:.
Common Name (eg, fully qualified host name) []:.
Email Address []:.

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:. ```

Must export an environmental variable to make node accept self-signed certs
like 
eblom@C02G70JCMD6Q mailchimptoZephr % export NODE_TLS_REJECT_UNAUTHORIZED='0'
eblom@C02G70JCMD6Q mailchimptoZephr % node scripts/testListener.js --port=443 --host=localhost --type=unsubscribe


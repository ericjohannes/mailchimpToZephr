from pickletools import read_uint1
import requests
import json


data = {
  "type": "unsubscribe",
  "fired_at": "2009-03-26 21:40:57",
  "data": {
    "action": "unsub",
    "reason": "manual",
    "id": "8a25ff1d98",
    "list_id": "a6b5da1054",
    "email": "api+unsub@mailchimp.com",
    "email_type": "html",
    "ip_opt": "10.20.10.30",
    "campaign_id": "cb398d21d2",
    "merges": {
      "EMAIL": "api+unsub@mailchimp.com",
      "FNAME": "Mailchimp",
      "LNAME": "API",
      "INTERESTS": "Group1,Group2"
    }
  }
}
# data = json.dumps(data)
# url = 'http://127.0.0.1:3000'
url = 'http://192.168.0.5:3000'
response = requests.post(url, json=data)
print('hi')
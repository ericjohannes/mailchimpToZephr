from pickletools import read_uint1
import requests
import json


datafile = 'test.json'
data = ''
with open(datafile, 'r') as f:
  data = json.load(f) 
# data = json.dump(datafile)
# url = 'http://127.0.0.1:3000'
url = 'http://192.168.0.5:3000'
response = requests.post(url, json=data)
print('hi')
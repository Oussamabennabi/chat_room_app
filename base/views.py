from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
import random
import time
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import RoomMember







def getToken(request):
  appId = '10610abcf4d0446693bcce9c8035355c'
  appCertificate ="2a44dd5507ee4f698c76794b44df7177"
  channelName = request.GET.get('channel')
  uid = random.randint(0,230)
  expirationTimeInSeconds = 3600*24
  currentTimestamp = time.time()
  privilegeExpiredTs = currentTimestamp+expirationTimeInSeconds 
  role = 1 # for host and guest 
  token = RtcTokenBuilder.buildTokenWithUid(appId,  appCertificate,channelName,uid,role, privilegeExpiredTs)

  return JsonResponse({'token':token,'uid':uid},safe=False)
 

def lobby(request):
 
  return render(request,'base/lobby.html')

def room(request,id):
  return render(request,'base/room.html')


@csrf_exempt
def createUser(request):
  data= json.loads(request.body)
  member,created = RoomMember.objects.get_or_create(
    room=data['room'],
    username=data['username'],
    uid=data['UID']
  )
  return JsonResponse({'username':data['username']},safe=False)

def getMember(request):
  uid = request.GET.get('UID')
  room = request.GET.get('room')
  member = RoomMember.objects.get(uid=uid,room=room)

  return JsonResponse({'username':member.username},safe=False)

def deleteMember(request):

  data= json.loads(request.body)
  member,created = RoomMember.objects.get_or_create(
     room=data['room'],
    username=data['username'],
    uid=data['UID']
  )
  return JsonResponse("member was deleted",safe=False)

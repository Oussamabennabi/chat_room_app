from django.db import models

# Create your models here.

class RoomMember(models.Model):
  room = models.CharField(max_length=200)
  uid = models.CharField(max_length=200)
  username = models.CharField(max_length=200)
  def __str__(self):
    return self.username
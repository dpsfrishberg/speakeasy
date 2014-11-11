from django.contrib.auth.models import User
from openid.consumer.consumer import SUCCESS
from django.core.mail import mail_admins

class GoogleBackend:

  def authenticate(self, openid_response):
    if openid_response is None:
      return None
    if openid_response.status != SUCCESS:
      return None
    google_email = openid_response.getSigned('http://openid.net/srv/ax/1.0', 'value.ext2')
    google_firstname = openid_response.getSigned('http://openid.net/srv/ax/1.0', 'value.ext0')
    google_lastname = openid_response.getSigned('http://openid.net/srv/ax/1.0', 'value.ext1')
    try:
      user = User.objects.get(username=google_email)
      if user.email == u'':
        user.email = google_email
        user.save()
    except User.DoesNotExist:
      user = User(username=google_email, first_name=google_firstname, last_name=google_lastname, email=google_email)
      user.save()

    return user

  def get_user(self, user_id):

    try:
      return User.objects.get(pk=user_id)
    except User.DoesNotExist:
      return None
from django import forms

class AccountCreationForm(forms.Form):
    domains = forms.CharField(widget=forms.Textarea)
    
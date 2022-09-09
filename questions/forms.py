from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from questions.models import GroupsQuestions


class UserAddForm(UserCreationForm):
    email = forms.EmailField(label = "Email")
    first_name = forms.CharField(label = "First name")
    last_name = forms.CharField(label = "Last name")

    class Meta:
        model = User
        fields = ("first_name", "last_name", "username", 'groups')


class GroupsQuestionsForm(forms.ModelForm):
    class Meta:
        model = GroupsQuestions
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'
            self.fields['in_active'].widget.attrs['class'] = 'custom-checkbox checkbox'
            # self.fields['groups'].widget.attrs['class'] = 'custom-select'
            self.fields['groups'].widget.attrs.update({'class': 'custom-select', 'size': '6', 'required': True})
            self.fields['name'].widget.attrs.update({'placeholder': 'Введите название группы'})
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Row, Column, Div, Field
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from questions.models import GroupsQuestions, Answers, Questions


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



class AnswersForm(forms.ModelForm):
    description = forms.CharField(widget=forms.Textarea(attrs={'rows': '5', 'placeholder': 'Введите ответ на вопрос'}),
                                  label='Ответ на вопрос:')

    class Meta:
        model = Answers
        fields = ['description', 'approved']


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
                Row(
                    Column('description', css_class='form-group col-12 mb-0'),
                    Column('approved', css_class='form-group col-12 mb-2 custom-checkbox checkbox'),
                )
        )

        self.fields['description'].widget.attrs['class'] = 'textarea form-control'


class QuestionsForm(forms.ModelForm):

    class Meta:
        model = Questions
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(QuestionsForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.layout = Layout(
            'description',
            # 'in_active',
            Row(
                Column(
                    Div(
                        'groups_questions',
                        Field('in_active', template='questions/file_field.html'),
                    ),
                    css_class='col-8'
                ),
                Column(Field('image', template='questions/file_field.html'),
                    css_class='col-4'),
            ),
            'doc_url',
        )
        self.fields['groups_questions'].widget.attrs.update({'class': 'custom-select', 'size': '6', 'required': True})
        self.fields['description'].widget.attrs.update({'rows': '5', 'placeholder': 'Введите вопрос'})
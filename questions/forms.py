from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Row, Column, Div, Field
from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, SetPasswordForm
from django.contrib.auth.models import User, Group

from questions.models import GroupsQuestions, Answers, Questions


class UserPasswordChangeForm(SetPasswordForm):
    """
    Форма изменения пароля
    """
    def __init__(self, *args, **kwargs):
        """
        Обновление стилей формы
        """
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control',
                'autocomplete': 'off'
            })


class UserAddForm(UserCreationForm):
# class UserAddForm(forms.ModelForm):
    email = forms.EmailField(label = "Email пользователя")
    first_name = forms.CharField(label = "Имя")
    last_name = forms.CharField(label = "Фамилия")

    # password1 = forms.CharField(
    #     label='Password',
    #     widget=forms.PasswordInput(attrs={'placeholder': 'Password'})
    # )
    # password2 = forms.CharField(
    #     label='Password confirmation',
    #     widget=forms.PasswordInput(attrs={'placeholder': 'Re-Enter Password'})
    # )
    # class Meta:
    #     model = User
    #     fields = ['first_name', 'last_name', 'email', 'username', 'groups']

    # def save(self, commit=True):
    #     # Save the provided password in hashed format
    #     user = super(UserAddForm, self).save(commit=False)
    #     password = self.cleaned_data["password1"]
    #     user.set_password(password)
    #     if commit:
    #         user.save()
    #         user.save_m2m()
    #     return user









    # groups = forms.ModelChoiceField(
    #     queryset=Group.objects.all(),
    #     to_field_name='name',
    #     required=True,
    #     label = "Группа/Отдел пользователя",
    #     widget=forms.Select(attrs={'class': 'form-control'})
    # )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'username', 'groups']

class UserEditForm(UserChangeForm):
    email = forms.EmailField(label = "Email пользователя", required=False)
    username = forms.CharField(label = "Логин пользователя")
    first_name = forms.CharField(label = "Имя")
    last_name = forms.CharField(label = "Фамилия")

    # groups = forms.ModelChoiceField(
    #     queryset=Group.objects.all(),
    #     to_field_name='name',
    #     label = "Группа/Отдел пользователя",
    #     widget=forms.SelectMultiple(attrs={'class': 'form-control'})
    # )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'username', 'email', 'groups', 'is_active', 'is_permits', 'password')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'
            self.fields['is_active'].widget.attrs['class'] = 'custom-checkbox checkbox'
            self.fields['is_permits'].widget.attrs['class'] = 'custom-checkbox checkbox'
            # self.fields['groups'].widget.attrs['class'] = 'custom-select'
            self.fields['groups'].widget.attrs.update({'class': 'custom-select', 'size': '6', 'required': True})





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
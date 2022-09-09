from django.contrib.auth.models import User, Group
from django.db import models
from django.shortcuts import reverse

"""Добавление поля в User без изменения модели"""
User.add_to_class('is_permits', models.BooleanField(verbose_name='Пройти опрос', default=True, help_text="Указывает, что пользователь имеет права для прохождения опроса."))

Group.add_to_class('is_group', models.BooleanField(verbose_name='Группа', default=False, help_text='Указывает, что группа относится к перечню группы подразделения.'))
Group.add_to_class('is_boss', models.BooleanField(verbose_name='Босс', default=False, help_text='Указывает, что пользователи группы имеют права Администратора.'))



class GroupsQuestions(models.Model):
    name = models.CharField(u"Наименование группы", max_length=200, null=True, blank=True)
    in_active = models.BooleanField("Активность группы", default=True, help_text="Атрибут указывающий выводить/не выводить группу вопросов при прохождении опроса")
    groups = models.ManyToManyField(
        Group, verbose_name="Группа отдела", blank=True
    )

    def __str__(self):
        return self.name

    def __unicode__(self):
        return '{}'.format(self.name)

    def get_group(self):
        return ", ".join([g.name for g in self.groups.all()])
    get_group.short_description = "Группа отдела"

    class Meta:
        verbose_name = "Группа вопросов"
        verbose_name_plural = "Группы вопросов"




class Questions(models.Model):
    """Вопросы"""
    description = models.TextField("Вопрос")
    in_active = models.BooleanField("Активность вопроса", default=True, help_text="Атрибут указывающий выводить/не выводить вопрос при прохождении опроса")
    groups_questions = models.ManyToManyField(
        GroupsQuestions, verbose_name="Группа вопросов", blank=True, related_name='question_group'
    )
    image = models.ImageField("Изображение", upload_to="guestions/", blank=True, null=True)
    doc_url = models.CharField("Ссылка на документ", max_length=250, blank=True, default = '')

    def get_absolute_url(self):
        return reverse('questions', kwargs={'pk': self.pk})

    def get_groups_questions(self):
        if self.groups_questions:
            return ", ".join([gq.name for gq in self.groups_questions.all()])

    get_groups_questions.short_description = "Группа вопросов"

    @property
    def image_url(self):
        if self.image and hasattr(self.image, 'url'):
            return self.image.url

    def __str__(self):
        return '{}'.format(self.description)

    def delete(self, *args, **kwargs):
        self.image.delete()
        super(Questions, self).delete(*args, **kwargs)


    def save (self, *args, **kwargs):
        try:
            this = Questions.objects.get(id = self.id)
            if this.image != self.image:
                this.image.delete()
        except:
            pass
        super(Questions, self).save(*args, **kwargs)


    class Meta:
        """Сортировка по полю ID
        ordering: List['id']
        """
        ordering = ['id']
        verbose_name = "Вопрос"
        verbose_name_plural = "Вопросы"


class Answers(models.Model):
    """Ответы на вопросы"""
    description = models.TextField("Текст ответа")
    question = models.ForeignKey(
        Questions, on_delete = models.CASCADE, related_name = 'answer_questions'
    )
    approved = models.BooleanField("Правильность ответа", default=False, help_text="Атрибут указывающий на правильность ответа")

    def __str__(self):
        return "%s, %s" % (self.description, self.approved)

    class Meta:
        verbose_name = "Ответ"
        verbose_name_plural = "Ответы"


class UsersAnswer(models.Model):
    """Ответы пользователей"""
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'user_permit_id', verbose_name="Пользователь")
    group = models.ForeignKey(Group, on_delete = models.CASCADE, related_name = 'user_group', verbose_name="Группа пользователя")
    session_key = models.CharField(max_length=150, verbose_name="Сессия пользователя")
    correct = models.BooleanField(verbose_name="Правильность ответа", default=False)
    vop = models.ForeignKey(Questions, on_delete=models.CASCADE, related_name='user_answer_vop', verbose_name="Вопрос в ответе")
    otv = models.IntegerField(verbose_name="Ответ", null=True, default=0)
    is_answer = models.BooleanField(verbose_name = "Признак ответа на вопрос", default = False)

    def __str__(self):
        return "%s, %s, %s" % (self.correct, self.vop, self.otv)

    class Meta:
        verbose_name = "Ответ пользователя"
        verbose_name_plural = "Ответы пользователей"


class WorkPermitUsers(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_permit')
    session_key = models.CharField(max_length=150, verbose_name="Сессия пользователя")
    date_passage = models.DateField(verbose_name="Дата прохождения опроса", auto_now_add=True)
    total_questions = models.IntegerField(verbose_name="Всего вопросов опроса", null=True, default=0)
    total_not_correct = models.IntegerField(verbose_name="Всего не правильных ответов", null=True, default=0)

    def __str__(self):
        return '{}'.format(self.date_passage)



# import tablib
# from docutils.nodes import field
# from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from .models import Questions, Answers, UsersAnswer, GroupsQuestions
from import_export import resources, fields, widgets


class QuestionsResource(resources.ModelResource):
    groups_questions = fields.Field(attribute='groups_questions', widget=widgets.ManyToManyWidget(GroupsQuestions, field='name'),
                                    column_name=u'Группа вопросов')
    description = fields.Field(attribute='description', column_name=u'Вопрос')
    in_active = fields.Field(widget=widgets.BooleanWidget(), attribute='in_active', column_name=u'Активность вопроса')
    image = fields.Field(attribute='image', column_name=u'Картинка')
    doc_url = fields.Field(attribute='doc_url', column_name=u'Ссылка на документ')

    # def get_queryset(self):
    #     print(self._meta.model.objects.prefetch_related('vop_id').all().query)
    #     return self._meta.model.objects.all()

    class Meta:
        model = Questions
        fields = ('id', 'description', 'in_active', 'groups_questions', 'image', 'doc_url')
        # fields = [field.name for field in Questions._meta.fields if field.name != "id"]
        # exclude = ["id"]
        # import_id_fields = ["id"]
        export_order = fields




class AnswersResource(resources.ModelResource):
    question_id = fields.Field(attribute='question_id', column_name=u'ID Вопроса')

    question__description = fields.Field(attribute='question', widget=widgets.ForeignKeyWidget(Questions, field='description'), column_name=u'Вопрос')
    question__in_active = fields.Field(widget=widgets.BooleanWidget(), attribute='question__in_active', column_name=u'Активность вопроса')
    question__groups_questions = fields.Field(attribute='question__groups_questions', widget=widgets.ManyToManyWidget(GroupsQuestions, field='name'),
                                    column_name=u'Группа вопросов')
    question__image = fields.Field(attribute='question__image', column_name=u'Картинка')
    question__doc_url = fields.Field(attribute='question__doc_url', column_name=u'Ссылка на документ')

    id = fields.Field(attribute='id', column_name=u'ID Ответа')
    description = fields.Field(attribute='description', column_name=u'Ответ')
    approved = fields.Field(widget=widgets.BooleanWidget(), attribute='approved', column_name=u'Правильность ответа')

    def get_queryset(self):
        # print(super().get_queryset().select_related('vop_id').query)
        return super().get_queryset().select_related('question')



    class Meta:
        model = Answers
        fields = ('question_id', 'question__description', 'question__in_active', 'question__groups_questions', 'question__image', 'question__doc_url', 'id', 'description', 'approved')
        export_order = fields

    # def export(self, queryset=None):
    #     if queryset is None:
    #         queryset = self.get_queryset()
    #     headers = self.get_export_headers()
    #     data = tablib.Dataset(headers=headers)
    #     for obj in queryset.iterator():
    #         data.append(self.export_resource(obj))
    #     # print(data)
    #     return data



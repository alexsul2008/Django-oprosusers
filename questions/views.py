import json
import os
from random import shuffle

import pprint

from core.settings import MEDIA_ROOT

from braces.views import GroupRequiredMixin
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import Group, User
# from django.contrib.auth.views import PasswordChangeView
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.messages import success
from django.contrib.messages.views import SuccessMessageMixin
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import models
from django.db.models import Count, Max, Q, F
from django.http import HttpResponseRedirect, request, JsonResponse, HttpResponse
from django.shortcuts import redirect, render
from django.template import RequestContext
from django.template.loader import render_to_string
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.generic import CreateView, DeleteView, UpdateView, ListView
from django_filters.views import FilterView
from extra_views import InlineFormSetView, CreateWithInlinesView, UpdateWithInlinesView, InlineFormSetFactory

# from django.views.generic.list import ListView


from questions.filters import UsersGroupsFilter, QuestionsFilter
from questions.forms import UploadExcelForm, UserAddForm, UserEditForm, GroupsQuestionsForm, AnswersForm, QuestionsForm, UserPasswordChangeForm, GroupsUserForm
from questions.models import Questions, GroupsQuestions, Answers, UsersAnswer, WorkPermitUsers
from questions.mixins import MessageMixin

import openpyxl
import pandas

global_total_questions = 0

def read_exel(request):

    # print(request.body)

    if request.method == 'POST':

        json_groups = json.loads(request.body)
        print(json_groups['groups_questions']) 

        fileDataExcel = MEDIA_ROOT + 'data.xlsx'
        df = pandas.read_excel(fileDataExcel)
        data = df.to_dict(orient='records')

        dataDict = [] # list

        itemsQuestion = {
            'questions': '',
            'answers': {}
        }

        answerDict = []
        for item in range(len(data)):

            if(str(data[item]['Правильность ответа']) == 'nan'):
                approvet = 0
            else:
                approvet = int(data[item]['Правильность ответа'])

            if(str(data[item]['Вопрос']) != 'nan' and str(data[item]['Вопрос']).strip() != ''):
                answerDict = []

                itemsQuestion = {
                    'questions': str(data[item]['Вопрос']),
                    'answers': answerDict
                }

                dataDict.append(itemsQuestion)

            answerDict.append({'answer': str(data[item]['Ответ']), 'approvet': approvet})

        # groups_questions = ['8', '9']
        # Перевод list в int
        groupsGuestions = list(map(int, json_groups['groups_questions']))

        print('Группы для записи: ', type(groupsGuestions), groupsGuestions)

        # pprint.pprint(dataDict)
        for index, value in enumerate(dataDict):

            question = dataDict[index]["questions"]
            question_id = Questions.objects.update_or_create(description=question)

            question_id[0].groups_questions.clear()


            for id in groupsGuestions:
                question_id[0].groups_questions.add(id)

            Answers.objects.filter(question_id=question_id[0].id).delete()

            for item in dataDict[index]["answers"]:
                
                answersItem = Answers.objects.create(description=item["answer"], approved=item["approvet"], question_id=question_id[0].id)
                # print('ANSWERS: ', answersItem)



        
        if os.path.exists(fileDataExcel):
            os.remove(fileDataExcel)
        else:
            print("File not found.")

        data = {}
        data['status'] = 200
        # data["groups_questions"] = groups_questions
        # data['endpoint'] = reverse_lazy('import_exel_test')
        return JsonResponse(data)


    context = {
            'data': dataDict
        }
    template = 'questions/import_tamplate.html'
    return render(request, template, context)


# def import_exel(request):
#     data = {}

#     question_groups = GroupsQuestions.objects.all().values()


#     data['status'] = 200
#     # data['question_groups'] = json.dumps(list(question_groups), cls=DjangoJSONEncoder)
#     data['question_groups'] = list(question_groups)

#     return JsonResponse(data)


@csrf_exempt
def importExelForm(request):

    if request.method == 'POST':
          
        form = UploadExcelForm(request.POST, request.FILES)   

        dictsGroup = dict(request.POST)

        print('Список групп: ', dictsGroup['groups_questions'])

        
        # for key, value in dict(request.POST).items():
        #     print('Key: ', key, ' Value: ', value)
        #     if key == 'groups_questions':
        #         groups = value

        # print('GROUPS: ', groups, type(groups))

     
        upload_file = request.FILES['import-exel']

        file_suffix = upload_file.name[upload_file.name.rfind('.'):]
        new_name_file = 'data' + file_suffix

        filename = default_storage.save(new_name_file, upload_file)

        print('Загружаемый файл: ', filename)
        data = {}
        data['status'] = 200
        data["groups_questions"] = dictsGroup['groups_questions']
        data['endpoint'] = reverse_lazy('import_exel_db')
        return JsonResponse(data)

        # elif nextCase == 'uploadDb':
        #     data = {}
        #     data['status'] = 200
        #     data['next'] = 'Cooooool'
        #     return JsonResponse(data)

   

    return JsonResponse({'status': 201})


    # print(request.content_type)
    # print(request.body)
    # print(request.body.File )

    # json_object = json.loads(request.body)

    # print(json_object)
    # # print(type(json_object))

    # for item in request.body:
    #     print(item)

    # groups_questions = json_object['groups_questions']

    # print(groups_questions)

    # data = {}

    # data['status'] = 200

    # return JsonResponse(data)




def random_question(array):
    """Перемешать список"""
    shuffle(array)
    return array


# def usedGroup(user, name_boss=None):
def usedGroup(user):
    """
	Определение Group user и создание списка вопросов определенных для Group user
	:param user:
	:return:
	"""
    user_group = Group.objects.all()
    if (user.is_superuser or user_group.filter(user=user, is_boss=True)):
        """Для суперпользователя и группы с атрибутом is_boss все вопросы в списке"""
        current_user_group = user_group.values()

        arrayQuestions = Questions.objects.filter(in_active=True) \
            .values_list('id', flat=True)
        arrayQuestions = random_question(list(arrayQuestions))
    else:
        """Для зарегистрированного user определяем список вопросов согласно групповой принадлежности"""
        current_user_group = user_group.filter(user=user).values_list('id', flat=True)[0]
        user_list_questions_groups = GroupsQuestions.objects.filter(groups=current_user_group, in_active=True).values_list('id', flat=True)
        arrayQuestions = Questions.objects.filter(in_active=True, groups_questions__in=list(user_list_questions_groups)) \
            .values_list('id', flat=True).distinct()
        arrayQuestions = random_question(list(arrayQuestions))
    return current_user_group, arrayQuestions


@login_required
def settingsViews(request):
    # list_group_user = Group.objects.all()
    # list_group_questions = GroupsQuestions.objects.all()

    # gr = GroupsQuestions.objects.get(pk=8)

    # print(gr.groups.all())
    # print(list_group_questions.query)


    context = {
            # 'list_group_user': list_group_user,
            # 'list_group_questions': list_group_questions
        }
    template = 'questions/settings_tamplate.html'
    return render(request, template, context)

@login_required
def group_question_activate(request, pk):
    if request.POST['activate'] == 'activate':
        active = request.POST['active'].title()
        if active == 'True':
            active = False
        else:
            active = True
        GroupsQuestions.objects.filter(id=pk).update(in_active=active)
    data={}
    data['active'] = active
    data['status'] = 200
    return JsonResponse(data, safe=False)



@login_required
def listGroupUsersView(request):
    list_group_user = Group.objects.all().values()
    list_group_questions = GroupsQuestions.objects.all()

    # print(list_group_questions)
    data={}
    groups_question = []
    for item in list_group_questions:
        # print(item.name, item.groups.all().values('id', 'name'))
        # print(index, value)
        lists = {
            'url': reverse_lazy('group_question_edit', kwargs={'pk': item.id}),
            'url-activate': reverse_lazy('group_question_activate', kwargs={'pk': item.id}),
            'id': item.id,
            'name': item.name,
            'in_active': item.in_active,
            'group_user': list(item.groups.all().values('id', 'name'))
        }
        groups_question.append(lists)

    # print(groups_question)
    data['groups_question'] = json.dumps(groups_question, cls=DjangoJSONEncoder)

    groups_user = []
    for index, value in enumerate(list_group_user):
        lists = {
            'url': reverse_lazy('group_user_edit', kwargs={'pk': value['id']}),
            'id': value['id'],
            'name': value['name'],
            'is_boss': value['is_boss'],
        }
        groups_user.append(lists)


    data['groups_user'] = json.dumps(groups_user, cls=DjangoJSONEncoder)

    return JsonResponse(data, safe=False)


@login_required
def questionsViews(request):
    """Первоначальная страница с вопросом"""
    global global_total_questions
    """Если список вопросв в сессии пуст, то определяем список из usedGroup"""
    if not 'listQuestionsCook' in request.session:
        user_groups, arrayQuestions = usedGroup(request.user)

    if global_total_questions > 0:
        """Перезагрузка сессии"""
        request.session.cycle_key()

    """Есть ли разрешение на прохождение опроса"""
    if request.user.is_permits:
        session_key = request.session.session_key
        if not session_key:
            request.session.cycle_key()

        """Проверяем наличие списка ID вопросов в сессии, есле нет его, то создаем"""
        if not 'listQuestionsCook' in request.session:
            request.session["listQuestionsCook"] = arrayQuestions

        """Кол-во вопросов"""
        if not 'total_questions' in request.session:
            request.session["total_questions"] = len(arrayQuestions)

        """Кол-во отвеченных вопросов"""
        if not 'count_questions' in request.session:
            request.session["count_questions"] = 1

        """Задаем список вопросов, всего вопросов, отвеченных вопросов"""
        arrayQuestions = request.session["listQuestionsCook"]
        total_questions = request.session["total_questions"]
        count_questions = request.session["count_questions"]

        """Проверка наличия ответа на вопрос (если user обновил браузер после ответа на вопрос"""
        is_answered = UsersAnswer.objects.filter(session_key=session_key, vop_id=arrayQuestions[0]).exists()
        # print(f'is_answered: {is_answered}')
        # print(f'Вопрос - {arrayQuestions[0]} из массива вопросов: {arrayQuestions}')

        """Выборка вопроса и ответов по первому ID из списка"""
        questions_list = Questions.objects.get(id=arrayQuestions[0])
        answers_list = Answers.objects.filter(question_id=questions_list.id)

        """Последний вопрос из списка"""
        try:
            last = arrayQuestions[1]
        except:
            last = arrayQuestions[0]

        context = {
            'list_next': last,
            'questions_list': questions_list,
            'count_questions': count_questions,
            'answers_list': answers_list,
            'total_questions': total_questions,
        }

        """На вопрос уже был ответ"""
        if is_answered:
            context['is_answered'] = True

        template_name = 'questions/questionview.html'
        return render(request, template_name, context)

    else:
        """Разрешение на прохождение опроса нет"""
        context = {}
        template_name = 'questions/question_not_permits.html'
        return render(request, template_name, context)


@csrf_protect
def question_ajax(request):
    """
	Данные по отвеченному вопросу получаем из POST-запроса
	:param request:
	:return: JsonResponse(data):
	"""
    session_key = request.session.session_key

    if request.user.is_superuser:
        data = {}
    else:
        group_id = Group.objects.filter(user=request.user).values_list('id', flat=True)[0]

        data = {}

        """Тип ответа"""
        correct = request.POST.get('correct')
        """ID вопроса"""
        vop_id = request.POST.get('vop')
        """ID ответа"""
        otv_id = request.POST.get('otv')

        """Проверка наличия ответа на вопрос (если user обновил браузер после ответа на вопрос"""
        data['is_answered'] = UsersAnswer.objects.filter(session_key=session_key, vop_id=vop_id).exists()
        data['otv_id'] = otv_id

        """Если user не отвечал на текущий вопрос"""
        if not data['is_answered']:
            """ Создаем запись в таблице с ответом пользователя"""
            UsersAnswer.objects.create(user_id=request.user.id, group_id=group_id, session_key=session_key,
                                       correct=correct, vop_id=vop_id,
                                       otv_id=otv_id, is_answer=True)
        else:
            pass

    return JsonResponse(data)


@csrf_protect
def next_question(request):
    """
	Определение следующего вопроса и удаление предыдущего из списка вопросов
	:param request:
	:return: JsonResponse(data):
	"""
    global global_total_questions

    """ Определяем список вопросов, кол-во вопросов и кол-во отвеченных из текущей сессии"""
    massivId = request.session["listQuestionsCook"]
    total = int(request.session["total_questions"])
    counts = int(request.session["count_questions"])

    counts += 1
    """ Задаем кол-во отвеченных вопросов """
    request.session["count_questions"] = counts

    data = {}
    """ Удаляем из списка первый ID вопроса """
    del massivId[0]

    """ Если список вопросов пуст"""
    if len(massivId) == 0:
        data['flag'] = 1

        """ Запрещаем доступ на прохождение опроса """
        if not request.user.is_superuser:
            User.objects.filter(username=request.user.username).update(is_permits=False)

        user_id = User.objects.get(username=request.user.username).id
        session_key = request.session.session_key

        """ Кол-во не правильно отвеченных вопросов"""
        total_not_correct = UsersAnswer.objects.filter(session_key=session_key, correct=False).count()

        """ Создаем запись по сессии о пройденом опросе (для вывода статистики)"""
        WorkPermitUsers.objects.create(user_id=user_id, session_key=session_key, total_questions=total,
                                       total_not_correct=total_not_correct)

        global_total_questions = counts - 1

        """ Очищаем сессию"""
        del request.session["listQuestionsCook"]
        del request.session["total_questions"]
        del request.session["count_questions"]

        """Для суперпользователя и группы с атрибутом is_boss определяем страницу статистики ответов всех users"""
        if (request.user.is_superuser or request.user.groups.filter(is_boss=True)):
            # url = '/statistics/'
            url = reverse_lazy('statistics')
        else:
            """ Определяем страницу статистики user"""
            # url = '/statistics-user/'
            url = reverse_lazy('statistics_user')

        data['url'] = url
        return JsonResponse(data)
    else:
        data['flag'] = 0
        """ Список не пуст - берем первый ID списка"""
        pk = massivId[0]

        questions_list = Questions.objects.get(id=pk).description
        answers_list = Answers.objects.filter(question_id=pk)

        """Последний вопрос из списка"""
        try:
            last = massivId[1]
        except:
            last = massivId[0]

        """ Задаем список в сессии"""
        request.session["listQuestionsCook"] = massivId
        # data['questions_list'] = serializers.serialize('json', questions_list, indent=2, ensure_ascii=False, fields=('description','image', 'doc_url'))
        data['questions_list'] = questions_list
        data['answers'] = serializers.serialize('json', answers_list, indent=2, ensure_ascii=False,
                                                fields=('description', 'approved'))
        data['next'] = last
        data['id'] = massivId[0]
        data['count'] = counts
        data['total'] = total

        return JsonResponse(data)

@login_required
def addUsersForGroup(request):
    name = request.POST.get('name').strip()
    if request.user.is_superuser:
        from questions.auth_ADMSK import LdapADMSK
        data = {}
        data['status'] = LdapADMSK().add_users_group(request, name)

        print(data['status'])


    # return HttpResponseRedirect(reverse("statistics"))
    return JsonResponse(data)


@login_required
def oprosanswers_list(request):

    session_for_user = request.POST.get('val')

    print(session_for_user)

    answers = UsersAnswer.objects.filter(session_key=session_for_user).values('correct', 'vop_id', 'vop__description', 'otv_id')

    data = {}
    data['status'] = 200
    data['answers'] = list(answers)

    for index, value in enumerate(answers):
        data['answers'][index]['otv'] = list(Answers.objects.filter(question=value['vop_id']).values())

    return JsonResponse(data, safe=False)


@login_required
def statisticsuser(request):
    """
	Статистика пройденных опросов пользователя
	:param request:
	:return:
	"""

    users = User.objects.all().exclude(is_superuser=True)

    if not (request.user.is_superuser or request.user.groups.values('is_boss')[0]['is_boss']):
        sessions_lists_users = WorkPermitUsers.objects.filter(user_id=request.user.id).values('id', 'session_key', 'date_passage').order_by('-date_passage', '-id')

        models_users_answers = UsersAnswer

        list_quests = []

        for sessions_us in sessions_lists_users:
            user_answers_not_correct = models_users_answers.objects.filter(session_key=sessions_us['session_key'], correct=False).values_list('vop', flat=True).order_by('vop')

            """Количество не правильных ответов"""
            user_answers_not_correct_total = user_answers_not_correct.count()

            """Количество вопросов-ответов в сессии"""
            models_users_answers_total = models_users_answers.objects.filter(
                session_key=sessions_us['session_key']).count()

            if models_users_answers_total != 0:
                percents = user_answers_not_correct_total * 100 / models_users_answers_total
            else:
                percents = 0

            user_answers_not_correct_quest = []
            for i in user_answers_not_correct:
                question = Questions.objects.get(id=i)
                new_answ = Answers.objects.filter(question_id=i).values('id', 'description', 'approved',
                                                                        'question_id').order_by('question_id',
                                                                                                'id')

                new_user_answer = UsersAnswer.objects.filter(session_key=sessions_us['session_key'],
                                                             correct=False).values_list('otv',
                                                                                        flat=True)

                list_quest_all_new = {
                    'id': question.id,
                    'otv': list(new_user_answer),
                    'question': question.description,
                    'new_answ': list(new_answ),
                }

                user_answers_not_correct_quest.append(list_quest_all_new)

            list_vop_count = {
                'count': user_answers_not_correct_total,
                'count_all_question': models_users_answers_total,
                'percents': round(percents),
                'date_passage': sessions_us['date_passage'],
                'number_opros_id': sessions_us['id'],
                'vop': user_answers_not_correct_quest,
            }

            list_quests.append(list_vop_count)

        context = {
            'user_stat': list_quests,
        }
        template = 'questions/statistics_questions.html'
    return render(request, template, context)


def render_to_json(request, data):
    return HttpResponse(
        json.dumps(data, ensure_ascii=False),
        mimetype=request.is_ajax() and "application/json" or "text/html"
    )


@csrf_protect
# @staff_member_required
def statisticsUserDeleteView(request, pk):
    delete_session = WorkPermitUsers.objects.filter(id=pk) #.values('session_key')[0]['session_key']
    # print(delete_session)
    delete_session_val = delete_session.values('session_key')[0]['session_key']
    # del_session_answer = UsersAnswer.objects.filter(session_key__exact=delete_session_val[0]['session_key'])
    del_session_answer = UsersAnswer.objects.filter(session_key__exact=delete_session_val)

    print(delete_session_val)

    # del_key = delete_session_val[0]['session_key']

    del_session_answer.delete()
    delete_session.delete()
    data = {}
    data['key'] = json.dumps(delete_session_val, cls=DjangoJSONEncoder)

    return JsonResponse(data)


class UsersGroupListsNew(LoginRequiredMixin, GroupRequiredMixin, FilterView):
    model = User
    template_name = 'questions/filter_statistics_users_answers.html'
    # context_object_name = 'statistics_filter'
    context_object_name = 'statistics_users'
    paginate_by = 20
    # ordering = 'last_name'
    filterset_class = UsersGroupsFilter

    # group_required = [i for i in Group.objects.filter(is_boss = True).values_list('name', flat = True)]
    # group_required = [u"Руководитель", u"Модератор"]
    def get_group_required(self):
        self.group_required = Group.objects.filter(is_boss=True).values_list('name', flat=True)
        return self.group_required

    def get_queryset(self):
        queryset = super(UsersGroupListsNew, self).get_queryset() \
            .all() \
            .exclude(is_superuser=True) \
            .annotate(permit_count=Count('user_permit')) \
            .annotate(date_last_answ=Max('user_permit__date_passage')) \
            .values('id', 'first_name', 'last_name', 'is_permits', 'permit_count', 'date_last_answ', 'groups__name', 'groups__is_boss').order_by('last_name')


        self.filterset = self.filterset_class(self.request.GET, queryset=queryset)
        return self.filterset.qs

    def get_context_data(self, **kwargs):
        context = super(UsersGroupListsNew, self).get_context_data(**kwargs)
        context['filterset'] = self.filterset
        context['user_session'] = WorkPermitUsers.objects.filter(user_id__in = User.objects.values('id')) \
            .annotate(persents=(F('total_not_correct') * 100 / F('total_questions'))) \
            .values('id', 'user_id', 'session_key', 'date_passage', 'total_questions', 'total_not_correct', 'persents') \
                .order_by('-date_passage', '-id')

        query = self.request.GET.copy()
        if 'page' in query:
            del query['page']
        context['queries'] = query
        return context



@csrf_protect
def total_users(request):
    dt = json.loads(request.POST.get('data'))

    q = Group.objects.all()
    total_users_groups = q.filter(id__in=dt['groups']).values('id').annotate(total=Count('user__id'))

    users_count = User.objects.exclude(is_superuser=True)

    total_is_permits = []
    for x in dt['is_permits']:
        if x == '':
            total_is_permits.append([{'is_permits': '', 'total': users_count.count()}])
        else:
            user_permit = users_count.filter(is_permits=x).values('is_permits').distinct().annotate(total=Count('id'))

            # print(user_permit)

            if user_permit:
                total_is_permits.append(list(user_permit))
            else:
                total_is_permits.append([{'is_permits': x, 'total': 0}])

    data = {}
    data['users'] = json.dumps(list(total_users_groups), cls=DjangoJSONEncoder)
    data['is_permits'] = json.dumps(list(total_is_permits), cls=DjangoJSONEncoder)

    return JsonResponse(data)


@csrf_protect
def total_questions(request):
    dt = json.loads(request.POST.get('data'))

    q = Questions.objects.all()

    total_count = q.count()

    total_groups_questions = GroupsQuestions.objects.values('id').filter(id__in=dt['groups_questions']) \
        .annotate(total=Count('question_group__id'))

    total_in_active = []
    for x in dt['in_active']:
        if x == '':
            total_in_active.append([{'in_active': '', 'total': total_count}])
            # total_in_active.append([{'in_active': '', 'total': q.count()}])
        else:
            total_in_active.append([{'in_active': x, 'total': q.filter(in_active=x).count()}])

    total_doc_url = []
    for docurl in dt['doc_url']:

        if docurl == '':
            total_doc_url.append([{'doc_url': '', 'total': total_count}])
            # total_doc_url.append([{'doc_url': '', 'total': q.count()}])
        elif docurl == 'False':
            total_doc_url.append(
                [{'doc_url': 'False', 'total': q.filter(Q(doc_url__isnull=True) | Q(doc_url='')).count()}])
        else:
            total_doc_url.append(
                [{'doc_url': 'True', 'total': q.exclude(Q(doc_url__isnull=True) | Q(doc_url='')).count()}])

    data = {}
    data['groups_questions'] = json.dumps(list(total_groups_questions), cls=DjangoJSONEncoder)
    data['in_active'] = json.dumps(list(total_in_active), cls=DjangoJSONEncoder)
    data['doc_url'] = json.dumps(list(total_doc_url), cls=DjangoJSONEncoder)
    return JsonResponse(data)


# Иззменение статуса разрешения пользователя на прохождение опроса из True/False
@csrf_protect
def user_checked(request):

    data = {}
    # data['is_permits'] = ''

    # print(request.POST)
    lists = request.POST['user_id'].split(',')
    is_permits = request.POST['val'].title()

    # print(f'Is_permits : {is_permits} - тип : {type(is_permits)}')

    if is_permits == 'True':
        is_permits = False
    else:
        is_permits = True

    if 'unchekced' in request.POST:
        unchekced = request.POST['unchekced']
        User.objects.exclude(is_superuser=True).exclude(groups__is_boss=True).update(is_permits=is_permits)
        data['unchekced'] = unchekced

    else:

        if len(lists) > 1:
            ids = lists
            User.objects.filter(id__in=ids).update(is_permits=is_permits)
        else:
            id = lists[0]
            User.objects.filter(id=id).update(is_permits=is_permits)

    data['is_permits'] = is_permits

    # print(f'data["is_permits"] : {data["is_permits"]}')

    return JsonResponse(data)


@login_required
def new_statisticsuser(request):
    all_answers_user = WorkPermitUsers.objects.filter(user_id = request.user.id) \
            .annotate(percents=(F('total_not_correct') * 100 / F('total_questions'))) \
            .values('id', 'user_id', 'session_key', 'date_passage', 'total_questions', 'total_not_correct', 'percents') \
                .order_by('-date_passage', '-id')

    list_quests = []

    for items in all_answers_user:
        list_vop_count = {
            'count': items['total_not_correct'],
            'count_all_question': items['total_questions'],
            'percents': round(items['percents']),
            'date_passage': items['date_passage'],
            'number_opros_id': items['id'],
            'oprosed': items['session_key'],
        }

        list_quests.append(list_vop_count)

    context = {
            'user_stat': list_quests,
        }
    template = 'questions/statistics_questions_new.html'
    return render(request, template, context)


@csrf_protect
def oprosanswers(request):
    sess = request.POST.get('opros')
    opros_id = request.POST.get('opros_id')

    list_questions = UsersAnswer.objects.filter(session_key=sess).values('vop_id', 'otv_id', 'vop_id__description')
    answers = Answers.objects.values('id', 'description', 'approved', 'question_id').order_by('question_id', 'id')

    print(sess)

    user_answers_quest = []
    for vop in list_questions:
        list_answers = [new_answ for new_answ in answers.filter(question_id=vop['vop_id'])]

        list_all = {
            'id': vop['vop_id'],
            'otv': [item['otv_id'] for item in list_questions],
            'new_answ': list_answers,
            'question': vop['vop_id__description'],
            'opros_id': opros_id,
        }

        user_answers_quest.append(list_all)

    data={}
    data['list_quests'] = json.dumps(user_answers_quest, cls=DjangoJSONEncoder)
    return JsonResponse(data)


@csrf_protect
def statistics_for_user(request):
    id = request.POST.get('pk')

    all_answers_user = WorkPermitUsers.objects.filter(user_id=id) \
            .values('id', 'session_key', 'date_passage', 'total_questions', 'total_not_correct') \
            .order_by('-date_passage')

    # answers = Answers.objects.values('id', 'description', 'approved', 'question_id').order_by('question_id', 'id')

    #######################################################################################
    # quest = Questions.objects.all()

    # answers_data = {}
    # all_answers_for_question = []
    # for item_q in quest:
    #     list_ans = {
    #         'quest_id': item_q.id,
    #         'answ': [item_answ for item_answ in answers.filter(question_id=item_q.id)]
    #     }
    #     all_answers_for_question.append(list_ans)

    # # answers_data['id_user'] = id
    # answers_data['result'] = all_answers_for_question
    # # answers_data['result'] = json.dumps(all_answers_for_question) #, ensure_ascii=False)

    # answers_json = json.dumps(answers_data) #, indent=2, ensure_ascii=False)


    # temp_dict = json.loads(answers_json)

    # # print(type(answers_json))
    # # print(answers_json)
    # # print(type(temp_dict))
    # # print(temp_dict)

    # # for item in temp_dict:
    #     # print(item['quest_id'])

    # # print(type(temp_dict))

    ##################################################################################################


    list_quests = []
    count_all_questions = []
    count_all_not_questions = []
    count_all_ok_questions = []
    date_passage = []

    # for sessions_us in all_answers_user:

    #     list_id_answers_not_correct = UsersAnswer.objects.filter(session_key=sessions_us['session_key'], correct=False).values('vop_id', 'otv_id', 'vop_id__description')

    #     # list_id_answers_not_correct = cache.get('list_id_answers_not_correct')
    #     # if not list_id_answers_not_correct:
    #     #     list_id_answers_not_correct = UsersAnswer.objects.filter(session_key=sessions_us['session_key'], correct=False).values('vop_id', 'otv_id', 'vop_id__description')
    #     #     cache.set('list_id_answers_not_correct', list_id_answers_not_correct, 60)


    #     # test_list_id_answers_not_correct = Answers.objects.filter(question_id__in=UsersAnswer.objects.filter(session_key=sessions_us['session_key'], correct=False).values('vop_id')).values()

    #     # print(test_list_id_answers_not_correct.query)



    #     # print(list_id_answers_not_correct)

    #     ######################################################
    #     # user_answers_not_correct_quest = []


    #     # list_quest_all_new = {
    #     #         'id': [item['vop_id'] for item in list_id_answers_not_correct],
    #     #         'otv': [item['otv_id'] for item in list_id_answers_not_correct],
    #     #         'new_answ': [item for item in answers.filter(question_id__in = [item['vop_id'] for item in list_id_answers_not_correct])],
    #     #         'question': [item['vop_id__description'] for item in list_id_answers_not_correct],
    #     #     }

    #     # user_answers_not_correct_quest.append(list_quest_all_new)

    #     # print(json.dump({'data': test_list_id_answers_not_correct}))

    #     ########################################################

    #     # print(*[item['vop_id'] for item in list_id_answers_not_correct])
    #     # print([item['vop_id'] for item in list_id_answers_not_correct])
    #     # print('*'*25)


    #     """Количество не правильных ответов"""
    #     user_answers_not_correct_total = sessions_us['total_not_correct']

    #     """Количество вопросов-ответов в сессии"""
    #     models_users_answers_total = sessions_us['total_questions']

    #     # print(models_users_answers_total)

    #     if models_users_answers_total != 0:
    #         percents = user_answers_not_correct_total * 100 / models_users_answers_total
    #     else:
    #         percents = 0

    #     user_answers_not_correct_quest = []

    #     for vop in list_id_answers_not_correct:

    #         # list_answers = [new_answ for new_answ in Answers.objects.filter(question_id=vop['vop_id']) \
    #         #                 .values('id', 'description', 'approved', 'question_id', 'question_id__description') \
    #         #                 .order_by('question_id', 'id')]
    #         list_answers = [new_answ for new_answ in answers.filter(question_id=vop['vop_id'])]


    #         # list_answers = cache.get('list_answers')
    #         # if not list_answers:
    #         #     list_answers = [new_answ for new_answ in answers.filter(question_id=vop['vop_id'])]
    #         #     cache.set('list_answers', list_answers, 60)

    #         # print(list_answers)

    #         list_quest_all_new = {
    #             'id': vop['vop_id'],
    #             'otv': [item['otv_id'] for item in list_id_answers_not_correct],
    #             'new_answ': list_answers,
    #             'question': vop['vop_id__description'],
    #         }

    #         user_answers_not_correct_quest.append(list_quest_all_new)

    list_vop_count = {
        'count': user_answers_not_correct_total,
        'count_all_question': models_users_answers_total,
        'percents': round(percents),
        'date_passage': sessions_us['date_passage'],
        'number_opros_id': sessions_us['id'],
        # 'vop': user_answers_not_correct_quest,
    }

    list_quests.append(list_vop_count)

    count_all_questions.append(models_users_answers_total)
    count_all_not_questions.append(user_answers_not_correct_total)
    count_all_ok_questions.append(models_users_answers_total - user_answers_not_correct_total)
    date_passage.append({'date': str(sessions_us['date_passage'].isoformat())})

    data = {}
    data['user_id'] = id
    data['list_quests'] = json.dumps(list_quests, cls=DjangoJSONEncoder)
    data['count_all_questions'] = count_all_questions
    data['count_all_not_questions'] = count_all_not_questions
    data['count_all_ok_questions'] = count_all_ok_questions
    data['date_passage'] = json.dumps(date_passage, cls=DjangoJSONEncoder)

    # print(type(data))

    return JsonResponse(data)


# Иззменение статуса активности вопроса из True/False
@csrf_protect
def question_inactive(request):
    id = request.POST['id']
    in_active = request.POST['in_active']

    if in_active == 'True':
        in_active = False
    else:
        in_active = True

    Questions.objects.filter(id=id).update(in_active=in_active)
    data = {}
    data['in_active'] = in_active

    return JsonResponse(data)


class UserPasswordChangeView(SuccessMessageMixin, UpdateView):
    form_class = PasswordChangeForm
    template_name = 'questions/user_password_change_form.html'
    context_object_name = 'passw'
    success_url = reverse_lazy('statistics')
    queryset = User.objects.all()

    def get_success_message(self, cleaned_data):
        return f'Пароль для пользователя: {self.object.first_name} {self.object.last_name} - успешно изменён.'

    def get(self, request, *args, **kwargs):
        self.object = User.objects.get(id=kwargs['pk'])
        return super(UserPasswordChangeView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(UserPasswordChangeView, self).post(request, *args, **kwargs)


    # def get_object(self, queryset=None, **kwargs):
    #     # print(f"Пользователь: {kwargs['pk']}")
    #     return self.request.get(kwargs['pk'])

    def get_form_kwargs(self):
        kwargs = super(UserPasswordChangeView, self).get_form_kwargs()
        kwargs['user'] = kwargs.pop('instance')
        # print(f"KWARGS: {kwargs}")
        return kwargs


class UserCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    template_name = 'questions/user_add_form.html'
    form_class = UserAddForm
    success_url = reverse_lazy('statistics')
    success_message = "Пользователь: %(name)s - успешно добавлен."
    error_url = reverse_lazy('statistics')
    # error_message = "Данные не корректны."

    def get_success_message(self, cleaned_data):
        # return f'Для пользователя: {self.object.first_name} {self.object.last_name} - данные успешно изменены.'
        return self.success_message % dict(cleaned_data, name= self.object.first_name + ' ' + self.object.last_name)

    # def get_error_message(self, form):
    #     # return self.error_message % dict(form.cleaned_data)
    #     return dict(form.errors.as_data())


    def form_valid(self, form):
        instance = form.save(commit=False)
        instance.save()
        form.save_m2m()
        return super().form_valid(form)


    def form_invalid(self, form):
        error = form.errors
        error_message =list(error.as_data()["password2"][0])
        messages.error(self.request, error_message[0])
        return HttpResponseRedirect(self.error_url, error_message[0])





class UserEditView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = User
    form_class = UserEditForm
    template_name = 'questions/user_edit_form.html'
    success_url = reverse_lazy('statistics')
    error_url = reverse_lazy('statistics')
    success_message = "Для пользователя: %(name)s - данные успешно обновлены."
    # error_message = "Группа пользователей: %(name)s - уже существует."
    error_message = "Данные не корректны. Заполните все поля"

    # def post(self, request, *args, **kwargs):
    #     self.object = self.get_object()
    #     print(self, request, args, kwargs, self.object)
    #     return super().post(request, *args, **kwargs)

    def get_success_message(self, cleaned_data):
        # return f'Для пользователя: {self.object.first_name} {self.object.last_name} - данные успешно изменены.'
        return self.success_message % dict(cleaned_data, name= self.object.first_name + ' ' + self.object.last_name)

    def get_error_message(self, cleaned_data):
        return self.error_message % dict(cleaned_data)


    def form_valid(self, form):
        self.object = form.save()
        # form.save_m2m()
        return super().form_valid(form)


    def form_invalid(self, form):
        error_message = self.get_error_message(form.cleaned_data)
        if self.error_message:
            messages.error(self.request, error_message)
        return HttpResponseRedirect(self.error_url, error_message)


    def get_context_data(self, **kwargs):
        # print(self.get_object().id, self.kwargs['pk'])
        id_user = self.kwargs['pk']
        context = super().get_context_data(**kwargs)
        context['url_password'] = reverse_lazy('user_pass_change', kwargs={'pk': id_user})
        # print(context)
        return context


class UserDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = User
    template_name = 'questions/user_delete_form.html'
    success_url = reverse_lazy('statistics')
    # success_message = "Пользовател: %(name)s - удален."
    # success_message = "Пользователь: %(first_name)s - удален."

    def get_success_message(self, cleaned_data):
        return f'Пользователь: {self.object.first_name} {self.object.last_name} - успешно удален.'



class GroupUserCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = Group
    form_class = GroupsUserForm
    template_name = 'questions/group_user_add_form.html'
    success_url = reverse_lazy('settings')
    error_url = reverse_lazy('settings')
    success_message = "Группа пользователей: %(name)s - добавлена."
    error_message = "Группа пользователей: %(name)s - уже существует."

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)

    def get_error_message(self, form):
        return self.error_message % dict(name=form["name"].data)

    def form_invalid(self, form):
        error_message = self.get_error_message(form)
        if self.error_message:
            messages.error(self.request, error_message)

        return HttpResponseRedirect(self.error_url, error_message)


class GroupUserEditView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Group
    form_class = GroupsUserForm
    template_name = 'questions/group_user_edit_form.html'
    success_url = reverse_lazy('settings')
    success_message = "Группа пользователей: %(name)s  - успешно изменена."

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)


class GroupUserDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = Group
    template_name = 'questions/group_user_delete_form.html'
    success_url = reverse_lazy('settings')
    success_message = "Группа пользователей: %(name)s  - успешно удалена."

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)



class GroupsQuestionsCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = GroupsQuestions
    form_class = GroupsQuestionsForm
    template_name = 'questions/groups_question_form.html'
    success_url = reverse_lazy('settings')
    success_message = "Группа вопросов: %(name)s - успешно создана."

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)



class GroupsQuestionsUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = GroupsQuestions
    form_class = GroupsQuestionsForm
    template_name = 'questions/groups_question_update_form.html'
    success_url = reverse_lazy('settings')
    success_message = "Группа вопросов: %(name)s - успешно обновлена"

    def post(self, request, *args, **kwargs):
        print(self, request, args, kwargs)
        self.object = self.get_object()
        return super(GroupsQuestionsUpdateView, self).post(request, *args, **kwargs)

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)


class GroupsQuestionsDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = GroupsQuestions
    template_name = 'questions/groups_question_confirm_delete.html'
    success_url = reverse_lazy('settings')
    success_message = 'Группа вопросов: %(name)s - удалена.'

    def get_success_message(self, cleaned_data):
        return self.success_message % dict(cleaned_data, name=self.object.name)

    # def delete(self, request, *args, **kwargs):
    #     obj = self.get_object()
    #     data_to_return = super(GroupsQuestionsDeleteView, self).delete(request, *args, **kwargs)
    #     messages.success(self.request, self.success_message % obj.__dict__)
    #     return data_to_return


class QuestionsGroupListsNew(LoginRequiredMixin, GroupRequiredMixin, FilterView):
    model = Questions
    template_name = 'questions/questions_group_list.html'
    context_object_name = 'filter'
    paginate_by = 20
    filterset_class = QuestionsFilter


    def get_group_required(self):
        self.group_required = Group.objects.filter(is_boss=True).values_list('name', flat=True)
        return self.group_required

    def get_queryset(self):
        queryset = super(QuestionsGroupListsNew, self).get_queryset().all()
        self.filterset = self.filterset_class(self.request.GET, queryset=queryset)
        return self.filterset.qs.distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filterset'] = self.filterset
        context['question_groups'] = GroupsQuestions.objects.all()

        query = self.request.GET.copy()
        if 'page' in query:
            del query['page']
        context['queries'] = query
        return context


# class AnswersInline(InlineFormSetView):
class AnswersInline(InlineFormSetFactory):
    model = Answers
    form_class = AnswersForm
    prefix = 'answers-form'
    factory_kwargs = {'extra': 1, 'can_delete': True}


class QuestionsCreateView(LoginRequiredMixin, CreateWithInlinesView):
    model = Questions
    form_class = QuestionsForm
    inlines = [AnswersInline]
    template_name = 'questions/question_form.html'
    success_url = reverse_lazy('filter')
    success_message = 'Вопрос успешно удален.'



class QuestionsUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateWithInlinesView):
    model = Questions
    form_class = QuestionsForm
    inlines = [AnswersInline]
    template_name = 'questions/question_update_form.html'
    success_url = reverse_lazy('filter')
    success_message = 'Вопрос успешно обнавлен.'

    # def get_success_message(self, cleaned_data):
    #     return self.success_message % dict(cleaned_data, name=self.object.name)


class QuestionsDeleteView(LoginRequiredMixin, DeleteView):
    model = Questions
    template_name = 'questions/question_confirm_delete.html'
    success_url = reverse_lazy('filter')
    success_message = 'Вопрос успешно удален.'

import json
from random import shuffle

from braces.views import GroupRequiredMixin
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import Group, User
from django.contrib.messages import success
from django.contrib.messages.views import SuccessMessageMixin
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Count, Max, Q
from django.http import request, JsonResponse, HttpResponse
from django.shortcuts import render
from django.template import RequestContext
from django.template.loader import render_to_string
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_protect
from django.views.generic import CreateView, DeleteView
from django_filters.views import FilterView

from questions.filters import UsersGroupsFilter, QuestionsFilter
from questions.forms import UserAddForm, GroupsQuestionsForm
from questions.models import Questions, GroupsQuestions, Answers, UsersAnswer, WorkPermitUsers

global_total_questions = 0


def random_question (array):
	"""Перемешать список"""
	shuffle(array)
	return array


# def usedGroup(user, name_boss=None):
def usedGroup (user):
	"""
	Определение Group user и создание списка вопросов определенных для Group user
	:param user:
	:return:
	"""
	user_group = Group.objects.all()
	if (user.is_superuser or user_group.filter(user = user, is_boss = True)):
		"""Для суперпользователя и группы с атрибутом is_boss все вопросы в списке"""
		current_user_group = user_group.values()

		arrayQuestions = Questions.objects.filter(in_active = True) \
			.values_list('id', flat = True)
		arrayQuestions = random_question(list(arrayQuestions))
	else:
		"""Для зарегистрированного user определяем список вопросов согласно групповой принадлежности"""
		current_user_group = user_group.filter(user = user).values_list('id', flat = True)[0]
		user_list_questions_groups = GroupsQuestions.objects.filter(groups = current_user_group).values_list('id', flat = True)
		arrayQuestions = Questions.objects.filter(in_active = True, groups_questions__in = list(user_list_questions_groups)) \
			.values_list('id', flat = True).distinct()
		arrayQuestions = random_question(list(arrayQuestions))
	return current_user_group, arrayQuestions


@login_required
def questionsViews (request):
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
		is_answered = UsersAnswer.objects.filter(session_key = session_key, vop_id = arrayQuestions[0]).exists()

		"""Выборка вопроса и ответов по первому ID из списка"""
		questions_list = Questions.objects.get(id = arrayQuestions[0])
		answers_list = Answers.objects.filter(question_id = questions_list.id)

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
def question_ajax (request):
	"""
	Данные по отвеченному вопросу получаем из POST-запроса
	:param request:
	:return: JsonResponse(data):
	"""
	session_key = request.session.session_key

	if request.user.is_superuser:
		data = {}
	else:
		group_id = Group.objects.filter(user = request.user).values_list('id', flat = True)[0]

		data = {}

		"""Тип ответа"""
		correct = request.POST.get('correct')
		"""ID вопроса"""
		vop_id = request.POST.get('vop')
		"""ID ответа"""
		otv = request.POST.get('otv')

		"""Проверка наличия ответа на вопрос (если user обновил браузер после ответа на вопрос"""
		is_answered = UsersAnswer.objects.filter(session_key = session_key, vop_id = vop_id).exists()

		"""Если user не отвечал на текущий вопрос"""
		if not is_answered:
			""" Создаем запись в таблице с ответом пользователя"""
			UsersAnswer.objects.create(user_id = request.user.id, group_id = group_id, session_key = session_key, correct = correct, vop_id = vop_id,
									   otv = otv, is_answer = True)
		else:
			pass

	return JsonResponse(data)


@csrf_protect
def next_question (request):
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
			User.objects.filter(username = request.user.username).update(is_permits = False)

		user_id = User.objects.get(username = request.user.username).id
		session_key = request.session.session_key

		""" Кол-во не правильно отвеченных вопросов"""
		total_not_correct = UsersAnswer.objects.filter(session_key = session_key, correct = False).count()

		""" Создаем запись по сессии о пройденом опросе (для вывода статистики)"""
		WorkPermitUsers.objects.create(user_id = user_id, session_key = session_key, total_questions = total,
									   total_not_correct = total_not_correct)

		global_total_questions = counts - 1

		""" Очищаем сессию"""
		del request.session["listQuestionsCook"]
		del request.session["total_questions"]
		del request.session["count_questions"]

		"""Для суперпользователя и группы с атрибутом is_boss определяем страницу статистики ответов всех users"""
		if (request.user.is_superuser or request.user.groups.filter(is_boss = True)):
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

		questions_list = Questions.objects.get(id = pk).description
		answers_list = Answers.objects.filter(question_id = pk)

		"""Последний вопрос из списка"""
		try:
			last = massivId[1]
		except:
			last = massivId[0]

		""" Задаем список в сессии"""
		request.session["listQuestionsCook"] = massivId
		# data['questions_list'] = serializers.serialize('json', questions_list, indent=2, ensure_ascii=False, fields=('description','image', 'doc_url'))
		data['questions_list'] = questions_list
		data['answers'] = serializers.serialize('json', answers_list, indent = 2, ensure_ascii = False, fields = ('description', 'approved'))
		data['next'] = last
		data['id'] = massivId[0]
		data['count'] = counts
		data['total'] = total

		return JsonResponse(data)


@login_required
def statisticsuser (request):
	"""
	Статистика пройденных опросов пользователя
	:param request:
	:return:
	"""

	users = User.objects.all().exclude(is_superuser = True)

	if not (request.user.is_superuser or request.user.groups.values('is_boss')[0]['is_boss']):
		sessions_lists_users = WorkPermitUsers.objects.filter(user_id = request.user.id).values('id', 'session_key', 'date_passage').order_by(
			'-date_passage', '-id')

		models_users_answers = UsersAnswer

		list_quests = []

		for sessions_us in sessions_lists_users:
			user_answers_not_correct = models_users_answers.objects.filter(session_key = sessions_us['session_key'], correct = False).values_list(
				'vop', flat = True).order_by('vop')

			"""Количество не правильных ответов"""
			user_answers_not_correct_total = user_answers_not_correct.count()

			"""Количество вопросов-ответов в сессии"""
			models_users_answers_total = models_users_answers.objects.filter(session_key = sessions_us['session_key']).count()

			if models_users_answers_total != 0:
				percents = user_answers_not_correct_total * 100 / models_users_answers_total
			else:
				percents = 0

			user_answers_not_correct_quest = []
			for i in user_answers_not_correct:
				question = Questions.objects.get(id = i)
				new_answ = Answers.objects.filter(question_id = i).values('id', 'description', 'approved', 'question_id').order_by('question_id',
																																   'id')

				new_user_answer = UsersAnswer.objects.filter(session_key = sessions_us['session_key'], correct = False).values_list('otv',
																																	flat = True)

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
	delete_session = WorkPermitUsers.objects.filter(id=pk)
	delete_session_val = delete_session.values('session_key')
	del_session_answer = UsersAnswer.objects.filter(session_key__exact=delete_session_val[0]['session_key'])

	del_session_answer.delete()
	delete_session.delete()
	data = {}
	# data['success'] = json.dumps(success, cls=DjangoJSONEncoder)
	data['message'] = json.dumps('Запись статистики удалена.', cls=DjangoJSONEncoder)
	data['title'] = json.dumps('Удаление записи статистики', cls=DjangoJSONEncoder)

	return JsonResponse(data)




class UsersGroupListsNew(LoginRequiredMixin, GroupRequiredMixin, FilterView):
	model = User
	template_name = 'questions/filter_statistics_users_answers.html'
	# context_object_name = 'statistics_filter'
	context_object_name = 'statistics_users'
	paginate_by = 20
	ordering = 'id'
	filterset_class = UsersGroupsFilter

	# group_required = [i for i in Group.objects.filter(is_boss = True).values_list('name', flat = True)]
	# group_required = [u"Руководитель", u"Модератор"]
	def get_group_required (self):
		self.group_required = Group.objects.filter(is_boss = True).values_list('name', flat = True)
		return self.group_required

	def get_queryset (self):
		queryset = super(UsersGroupListsNew, self).get_queryset() \
			.all() \
			.exclude(is_superuser = True) \
			.annotate(permit_count = Count('user_permit')) \
			.annotate(date_last_answ = Max('user_permit__date_passage')) \
			.values('id', 'first_name', 'last_name', 'is_permits', 'permit_count', 'date_last_answ', 'groups__name')

		self.filterset = self.filterset_class(self.request.GET, queryset = queryset)
		return self.filterset.qs

	def get_context_data (self, **kwargs):
		context = super(UsersGroupListsNew, self).get_context_data(**kwargs)
		context['filterset'] = self.filterset

		query = self.request.GET.copy()
		if 'page' in query:
			del query['page']
		context['queries'] = query
		return context


@csrf_protect
def total_users (request):
	dt = json.loads(request.POST.get('data'))
	# print(dt)

	q = Group.objects.all()
	total_users_groups = q.filter(id__in = dt['groups']).values('id').annotate(total = Count('user__id'))

	# print(total_users_groups)

	users_count = User.objects.exclude(is_superuser = True)

	total_is_permits = []
	for x in dt['is_permits']:
		if x == '':
			total_is_permits.append([{'is_permits': '', 'total': users_count.count()}])
		else:
			user_permit = users_count.filter(is_permits = x).values('is_permits').distinct().annotate(total = Count('id'))

			if user_permit:
				total_is_permits.append(list(user_permit))
			else:
				total_is_permits.append([{'is_permits': x, 'total': 0}])

	data = {}
	data['users'] = json.dumps(list(total_users_groups), cls = DjangoJSONEncoder)
	data['is_permits'] = json.dumps(list(total_is_permits), cls = DjangoJSONEncoder)

	return JsonResponse(data)

@csrf_protect
def total_questions(request):
	dt = json.loads(request.POST.get('data'))

	q = Questions.objects.all()

	total_groups_questions = GroupsQuestions.objects.values('id').filter(id__in=dt['groups_questions']) \
		.annotate(total=Count('question_group__id'))

	total_in_active = []
	for x in dt['in_active']:
		if x == '':
			total_in_active.append([{'in_active': '', 'total': q.count()}])
		else:
			total_in_active.append([{'in_active': x, 'total': q.filter(in_active=x).count()}])

	total_doc_url = []
	for docurl in dt['doc_url']:

		if docurl == '':
			total_doc_url.append([{'doc_url': '', 'total': q.count()}])
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
	User.objects.filter(id=request.POST.get('user_id')).update(is_permits=request.POST.get('val'))
	data = {}
	data['is_permits'] = request.POST.get('val')
	return JsonResponse(data)


@csrf_protect
def statistics_for_user(request):
	id = request.POST.get('pk')

	all_answers_user = WorkPermitUsers.objects.filter(user_id=id) \
		.values('id', 'session_key', 'date_passage') \
		.order_by('-date_passage', '-id')

	list_quests = []
	count_all_questions = []
	count_all_not_questions = []
	count_all_ok_questions = []
	date_passage = []

	for sessions_us in all_answers_user:
		user_answers_not_correct = UsersAnswer.objects \
			.filter(session_key=sessions_us['session_key'], correct=False) \
			.values_list('vop', flat=True) \
			.order_by('vop')
		# print(user_answers_not_correct)
		"""Количество не правильных ответов"""
		user_answers_not_correct_total = user_answers_not_correct.count()
		# print(user_answers_not_correct_total)
		"""Количество вопросов-ответов в сессии"""
		models_users_answers_total = UsersAnswer.objects.filter(session_key=sessions_us['session_key']).count()
		# print(models_users_answers_total)
		if models_users_answers_total != 0:
			# percents = round(len(user_answers) * 100 / models_users_answers_total)
			percents = user_answers_not_correct_total * 100 / models_users_answers_total
		else:
			percents = 0

		user_answers_not_correct_quest = []
		for i in user_answers_not_correct:
			question = Questions.objects.get(id=i)
			new_answ = Answers.objects.filter(question_id=i).values('id', 'description', 'approved', 'question_id').order_by('question_id', 'id')
			# print(new_answ.count())
			new_user_answer = UsersAnswer.objects.filter(session_key=sessions_us['session_key'], correct=False).values_list('otv', flat=True)

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
		# print(list_quests)

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

	return JsonResponse(data)




class UserCreateView(LoginRequiredMixin, CreateView):
	form_class = UserAddForm
	template_name = 'questions/user_add_form.html'
	success_url = reverse_lazy('statistics')

	def form_valid (self, form):
		username = form.cleaned_data['username']
		form.save()
		form.save_m2m()
		return JsonResponse({"username": username}, status = 200)

	def form_invalid (self, form):
		errors = form.errors.as_json()
		return JsonResponse({"errors": errors}, status = 400)


class UserDeleteView(LoginRequiredMixin, DeleteView):
	model = User

	def post (self, *args, **kwargs):
		self.object = self.get_object()
		self.object.delete()
		data = {'success': 'OK'}
		return JsonResponse(data)


class GroupsQuestionsCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
	model = GroupsQuestions
	form_class = GroupsQuestionsForm
	template_name = 'questions/groups_question_form.html'
	success_url = reverse_lazy('filter')
	success_message = "Группа вопросов: %(name)s"

	def get_success_message (self, cleaned_data):
		return self.success_message % dict(cleaned_data, name = self.object.name)


class QuestionsGroupListsNew(LoginRequiredMixin, GroupRequiredMixin, FilterView):
	model = Questions
	template_name = 'questions/questions_group_list.html'
	context_object_name = 'filter'
	paginate_by = 20
	filterset_class = QuestionsFilter

	# group_required = [i for i in Group.objects.filter(is_boss = True).values_list('name', flat = True)]
	# group_required = u"is_boss"
	# group_required = [u"Руководитель", u"Модератор"]
	def get_group_required (self):
		self.group_required = Group.objects.filter(is_boss = True).values_list('name', flat = True)
		return self.group_required

	def get_queryset (self):
		queryset = super(QuestionsGroupListsNew, self).get_queryset().all()
		self.filterset = self.filterset_class(self.request.GET, queryset = queryset)
		return self.filterset.qs.distinct()

	def get_context_data (self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['filterset'] = self.filterset

		query = self.request.GET.copy()
		if 'page' in query:
			del query['page']
		context['queries'] = query
		return context

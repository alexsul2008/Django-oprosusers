from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from .views import *

urlpatterns = [
	path('', questionsViews, name='questions'),

	path('questions/', QuestionsGroupListsNew.as_view(), name='filter'),

	path('group-questions/create/', GroupsQuestionsCreateView.as_view(), name='group_question_creat'),

	path('questionajax/', question_ajax, name='questionajax'),
	path('nextquestion/', next_question, name='nextquestion'),

	path('statistics-user/', statisticsuser, name='statistics_user'),
	path('statistics/', UsersGroupListsNew.as_view(), name='statistics'),
	path('statistics/<int:pk>/delete/', statisticsUserDeleteView, name='statisticsuserdelete'),

	path('user/add/', UserCreateView.as_view(), name='user_add'),
	path('user/<int:pk>/delete/', UserDeleteView.as_view(), name='user_delete'),

	path('totalquestions/', total_questions, name='totalquestions'),
	path('totalusers/', total_users, name='totalusers'),
	path('userchecked/', user_checked, name='userchecked'),
	path('statisticsforuser/', statistics_for_user, name='statistics_for_user'),



] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
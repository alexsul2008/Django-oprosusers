import random

from django.contrib.auth.models import User, Group
from django.core.management import call_command
from django.core.management.base import BaseCommand
from faker import Faker

from questions.models import GroupsQuestions, Questions


class Command(BaseCommand):
	help = "Information command"

	def handle(self, *args, **kwargs):
		call_command("makemigrations")
		call_command("migrate")
		call_command("loaddata", "db_group_fixture.json")
		call_command("loaddata", "db_user_fixture.json")


		groups_user = Group.objects.all()
		users = User.objects.all().exclude(is_superuser=True)

		for user in users:
			user.groups.add(random.choice(groups_user))

		call_command("loaddata", "db_questions_groups_fixture.json")
		call_command("loaddata", "db_questions_fixture.json")
		call_command("loaddata", "db_answers_fixture.json")

		groups_questions = GroupsQuestions.objects.all()
		questions_count = Questions.objects.count()

		for i in range(1, questions_count + 1):
			question = Questions.objects.get(id=i)
			for _ in range(1, random.randint(4, groups_questions.count()-1)):
				question.groups_questions.add(random.choice(groups_questions))

		gr_users = groups_user.filter(is_boss=False)

		for i in range(1, groups_questions.count() + 1):
			gr_questions = GroupsQuestions.objects.get(id=i)
			for _ in range(1, random.randint(2, gr_users.count())):
				gr_questions.groups.add(random.choice(gr_users))








from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Row, Column, Div, Field
from django import forms
from django.contrib.auth.models import User, Group
from django.db import models
from django.db.models import Q, Count, Sum, Case, When, OuterRef, Subquery, Exists, F
from django.forms import BoundField
from django.http import request
from django.utils.translation import gettext_lazy
from django_filters import FilterSet, filters
from django_filters.conf import settings
from django_filters.fields import Lookup
from django_filters.views import BaseFilterView, FilterView
from django_filters.widgets import BooleanWidget, LookupChoiceWidget

from questions.models import Questions, GroupsQuestions
import django_filters
from django.core.validators import EMPTY_VALUES

FILTER_CHOICES_ACTIVE = (
    ('True', 'Активный'),
    ('False', 'Не актвный'),
)
DOC_URL_FILTER_CHOICES = (
    ('True', 'С ссылкой'),
    ('False', 'Без ссылки'),
)
FILTER_CHOICES_PERMITS = (
    ('True', 'Разрешён'),
    ('False', 'Не разрешён'),
)


# class CountsQuestionsBoundField(BoundField):
#     @property
#     def total(self):
#
#         value = self.value()
#         if value:
#             return Group.objects.exclude(is_boss=True).filter(id=value).annotate(count=Count('questions')).values('count')
#         else:
#             return None
#
# class CountsQuestionsField(Field):
#     def get_bound_field(self, form, field_name):
#         print(field_name)
#         return CountsQuestionsBoundField(form, self, field_name)
#
# def get_counts_questions(queryset, name, value):
#     # print(Group.objects.exclude(is_boss=True).annotate(count=Count('questions')).values('count'))
#     #
#     # return list(Group.objects.exclude(is_boss=True).annotate(count=Count('questions')).values('count'))
#     # lookup = '__'.join([name, 'isnull'])
#     # count = Count('questions')
#     # print(count)
#     print(queryset)
#     return queryset.annotate(total=Count('groups'))
#     # return queryset.filter(**{lookup: False})

# class ChoiceFilterDoc(filters.ChoiceFilter):
#     def filter(self, qs, value):
#         if value != self.null_value:
#             return super().filter(qs, value)
#
#         qs = self.get_method(qs)(**{'%s__%s' % (self.field_name, self.lookup_expr): None})
#         print(self, qs, value)
#         return qs.distinct() if self.distinct else qs


# class EmptyStringFilter(filters.BooleanFilter):
#     def filter(self, qs, value):
#         if value in EMPTY_VALUES:
#             return qs
#
#         exclude = self.exclude ^ (value is False)
#         method = qs.exclude if exclude else qs.filter
#
#         print(self, qs, value)
#
#         return method(**{self.field_name: ""})



class QuestionsFilter(django_filters.FilterSet):

    groups_questions = django_filters.ModelMultipleChoiceFilter(
        queryset=GroupsQuestions.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'my_class_new', 'autocomplete': 'off'}),
    )
    in_active = django_filters.ChoiceFilter(
        choices=FILTER_CHOICES_ACTIVE,
        empty_label=gettext_lazy(u'Все'),
        widget=forms.RadioSelect(attrs={'autocomplete': 'off'})
    )

    doc_url = django_filters.ChoiceFilter(
        choices=DOC_URL_FILTER_CHOICES,
        method='filter_by_all_name_fields',
        empty_label=gettext_lazy(u'Все'),
        widget=forms.RadioSelect(attrs={'autocomplete': 'off'})
    )


    class Meta:
        model = Questions
        fields = []

    def filter_by_all_name_fields(self, queryset, name, value):
        self.name = name

        if value == 'False':
            return queryset.filter(
                Q(doc_url__isnull=True) | Q(doc_url='')
            )
        elif value == 'True':
            return queryset.exclude(Q(doc_url__isnull=True) | Q(doc_url=''))



class UsersGroupsFilter(django_filters.FilterSet):

    groups = django_filters.ModelMultipleChoiceFilter(
        queryset=Group.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'my_class_new', 'autocomplete': 'off'}),
    )

    is_permits = django_filters.ChoiceFilter(
        choices=FILTER_CHOICES_PERMITS,
        empty_label=gettext_lazy(u'Все'),
        widget=forms.RadioSelect(attrs={'autocomplete': 'off'})
    )


    class Meta:
        model = User
        fields = []









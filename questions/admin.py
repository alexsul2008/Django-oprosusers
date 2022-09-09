from __future__ import unicode_literals
import copy
from datetime import datetime

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import User, Group
from django.utils.translation import gettext_lazy as _

from django.utils.safestring import mark_safe

from core.settings import STATIC_URL, STATIC_DIR, MEDIA_URL  # , STATICFILES_DIRS
from .models import Questions, Answers, UsersAnswer, GroupsQuestions


from questions.resources import QuestionsResource, AnswersResource
from import_export.admin import ImportExportModelAdmin, ImportExportActionModelAdmin, ExportActionMixin, \
    ExportActionModelAdmin
from import_export.formats import base_formats
from import_export import resources
from import_export import fields

admin.site.site_title = "Опросник теоретический знаний"
admin.site.site_header = "Опросник теоретический знаний"
admin.site.index_title = ""


admin.site.unregister(User)

USERNAME_FIELD = get_user_model().USERNAME_FIELD
REQUIRED_FIELDS = (USERNAME_FIELD,) + tuple(get_user_model().REQUIRED_FIELDS)
BASE_FIELDS = (None, {
    'fields': REQUIRED_FIELDS + ('password',),
})

PERSONAL_FIELDS = ('Персональные данные', {
     'fields': ('last_name', 'first_name',),
})

SIMPLE_PERMISSION_FIELDS = (_('Permissions'), {
    'fields': ('is_permits', 'is_active', 'is_staff', 'is_superuser',),
})

ADVANCED_PERMISSION_FIELDS = copy.deepcopy(SIMPLE_PERMISSION_FIELDS)
# ADVANCED_PERMISSION_FIELDS[1]['fields'] += ('groups', 'user_permissions',)
ADVANCED_PERMISSION_FIELDS[1]['fields'] += ('groups',)

DATE_FIELDS = (_('Important dates'), {
    'fields': ('last_login', 'date_joined',),
})


class StrippedUserAdmin(UserAdmin):
    # The forms to add and change user instances
    # add_form_template = None
    # add_form = UserCreationForm
    # form = UserChangeForm

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = ('is_permits', USERNAME_FIELD, 'is_superuser', 'is_staff', 'is_active', )
    # print(REQUIRED_FIELDS)
    list_display_links = (USERNAME_FIELD,)
    # list_filter = ('groups', 'is_staff', 'is_active',)
    list_filter = ('groups', 'is_active', )



    fieldsets = (
        BASE_FIELDS,
        SIMPLE_PERMISSION_FIELDS,
    )
    add_fieldsets = (
        (None, {
            'fields': REQUIRED_FIELDS + (
                'password1',
                'password2',
            ),
        }),

    )
    search_fields = (USERNAME_FIELD,)
    ordering = None
    filter_horizontal = tuple()
    readonly_fields = ('last_login', 'date_joined')

    actions = ["performed", "deperformed"]

    def performed(self, request, queryset):
        row_update = queryset.update(is_permits=True)
        if row_update == 1:
            message_bit = "1 запись была обновлена"
        else:
            message_bit = f"{row_update} записи(ей) было(и) обновлены"
        self.message_user(request, f"{message_bit}")


    def deperformed(self, request, queryset):
        row_update = queryset.update(is_permits=False)
        if row_update == 1:
            message_bit = "1 запись была обновлена"
        else:
            message_bit = f"{row_update} записи(ей) было(и) обновлены"
        self.message_user(request, f"{message_bit}")

    performed.short_description = "Разрешить прохождение опроса"
    performed.allowed_permissions = ('change',)

    deperformed.short_description = "Запретить прохождение опроса"
    deperformed.allowed_permissions = ('change',)


class StrippedNamedUserAdmin(StrippedUserAdmin):
    def upper_case_name(obj):
        return ("%s %s" % (obj.last_name, obj.first_name)).upper()

    upper_case_name.short_description = 'Фамилия Имя'

    def group_name (self, obj):
        queryset = obj.groups.values_list('name', flat = True)
        groups = []
        for group in queryset:
            groups.append(group)

        return ' '.join(groups)

    group_name.short_description = 'Группа'

    # list_display = ('is_permits', 'last_name', 'first_name', 'username', 'is_superuser', 'is_staff', 'is_active', upper_case_name )
    # list_display_links = ('last_name', 'first_name', 'username',)
    list_display = ('is_permits', upper_case_name, 'username', 'email', 'group_name', 'is_superuser', 'is_staff', 'is_active')
    list_display_links = (upper_case_name, 'username',)

    search_fields = ('last_name', 'first_name', 'username',)


class UserAdmin(StrippedUserAdmin):
    fieldsets = (
        BASE_FIELDS,
        PERSONAL_FIELDS,
        ADVANCED_PERMISSION_FIELDS,
        DATE_FIELDS,
    )
    # filter_horizontal = ('groups', 'user_permissions',)
    filter_horizontal = ('groups', )


class NamedUserAdmin(UserAdmin, StrippedNamedUserAdmin):
    pass

admin.site.register(User, NamedUserAdmin)


admin.site.unregister(Group)
class CustomGroupAdmin(GroupAdmin):
    # list_display = ('name', 'is_boss', 'is_generic', 'is_question', 'is_group',)
    # list_display = ('name', 'is_generic', 'is_question', 'is_group',)
    list_display = ('name', 'is_boss',)
    # ordering = ('-is_boss',)

admin.site.register(Group, CustomGroupAdmin)


@admin.register(GroupsQuestions)
class GroupsQuestionsAdmin(admin.ModelAdmin):
    list_display = ('name', 'in_active', 'get_group')
    list_filter = (
        'in_active', ('groups', admin.RelatedOnlyFieldListFilter)
    )
    # ordering = ('-is_boss',)




class AnswerInline(admin.TabularInline):
    model = Answers
    extra = 1

@admin.register(Questions)
class QuestionAdmin(ImportExportActionModelAdmin):
    resource_class = AnswersResource
    readonly_fields = ("get_image_tab", "get_image")
    #Поля выводимые в разделе Вопросы
    list_display = ("id", "description", 'get_groups_questions', "get_image", "in_active")
    # list_filter = ("groups", "in_active",)
    # Фильтр только по вопросам групп (без Руководителя, Модератора)
    list_filter = (
        # 'in_active', ('groups_questions', admin.RelatedOnlyFieldListFilter)
        'in_active', 'groups_questions'
    )

    # Поля которое выполняет свойство редактирования
    list_display_links = ('description',)
    # Вывод кнопок сохранения в верхней части страницы
    save_on_top = True
    # view_on_site определять показывать ли ссылку “Посмотреть на сайте”.
    # Эта ссылка должна вести на страницу сохраненного объекта.
    # view_on_site = True

    # По умолчанию Django использует <select> для полей ForeignKey или тех, которые содержат choices.
    # Ели поле указанно в radio_fields, Django будет использовать радио кнопки.
    # radio_fields = {"groups": admin.VERTICAL}

    # Включение возможности переключения Активный/Не активный вопрос
    list_editable = ["in_active",]
    actions = ["activate", "deactivate", 'export_admin_action']

    # Используйте list_per_page, чтобы определить количество объектов на одной странице при отображении списка объектов.
    # По умолчанию равно 100.
    list_per_page = 100

    fieldsets = [
        (None, {
            'fields': [('description', 'get_image_tab'),]
        }),
        (None, {
            'fields': ['in_active', 'groups_questions', 'image', 'doc_url',]
        }),
        # (None, {
        #     'fields': ['image', 'doc_url',]
        # }),
        # (None, {
        #     'fields': ['doc_url']
        # }),
    ]
    inlines = [AnswerInline]

    def get_export_formats(self):
        """
        Returns available export formats.
        """
        formats = (
            base_formats.CSV,
            base_formats.XLS,
            base_formats.XLSX,
            # base_formats.TSV,
            # base_formats.ODS,
            # base_formats.JSON,
            # base_formats.YAML,
            # base_formats.HTML,
        )
        return [f for f in formats if f().can_export()]

    def get_import_formats(self):
        """
        Returns available import formats.
        """
        formats = (
            base_formats.CSV,
            base_formats.XLS,
            base_formats.XLSX,
            # base_formats.TSV,
            # base_formats.ODS,
            # base_formats.JSON,
            # base_formats.YAML,
            # base_formats.HTML,
        )
        return [f for f in formats if f().can_export()]

    def get_export_filename(self, request, queryset, file_format):
        # print(queryset)
        date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = "%s-%s.%s" % (self.model.__name__,
                                 date_str,
                                 file_format.get_extension())
        return filename


    class Meta:
        model = Questions
        fields = "__all__"

    @mark_safe
    def get_image(self, obj):
        if not obj.image:
            img_url = STATIC_URL+'media/no-img.jpg'
            # img_url = MEDIA_URL+'no-img.jpg'
            # print(img_url)
        else:
            img_url = obj.image.url

        return f'<img src="{img_url}" width="80" />' # if obj.image else ''
    get_image.short_description = "Изображение"

    @mark_safe
    def get_image_tab(self, obj):
        if not obj.image:
            img_url = STATIC_URL+'media/no-img.jpg'
        else:
            img_url = obj.image.url
        return f'<img src="{img_url}" width="200" />' # if obj.image else ''
    get_image_tab.short_description = "Изображение"


    def activate(self, request, queryset):
        row_update = queryset.update(in_active=True)
        if row_update == 1:
            message_bit = "1 запись была обновлена"
        else:
            message_bit = f"{row_update} записи(ей) было(и) обновлены"
        self.message_user(request, f"{message_bit}")


    def deactivate(self, request, queryset):
        row_update = queryset.update(in_active=False)
        if row_update == 1:
            message_bit = "1 запись была обновлена"
        else:
            message_bit = f"{row_update} записи(ей) было(и) обновлены"
        self.message_user(request, f"{message_bit}")

    activate.short_description = "Сделать выделенные вопросы активными"
    activate.allowed_permissions = ('change',)

    deactivate.short_description = "Сделать выделенные вопросы не активными"
    deactivate.allowed_permissions = ('change',)


@admin.register(UsersAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_key', )
    list_filter = ('user', )
    ordering = ('session_key', )
    # raw_id_fields = ('user', )

    class Meta:
        model = UsersAnswer
        fields = "__all__"







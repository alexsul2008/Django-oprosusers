# -*- coding:utf-8 -*-
from __future__ import unicode_literals

from django import template

# Third-party app imports

# Realative imports of the 'app-name' package


register = template.Library()


# @register.filter('has_group')
# def has_group(user, group_name):
#     """
#     Verifica se este usuário pertence a um grupo
#     """
#     groups = user.groups.all().values_list('name', flat=True)
#     return True if group_name in groups else False


@register.filter(name='has_boss')
def has_boss(user, user_boss):
    groups = user.groups.all().values_list('is_boss', flat=True)
    print(groups)
    return True if user_boss in groups else False
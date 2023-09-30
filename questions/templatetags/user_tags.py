# -*- coding:utf-8 -*-
from __future__ import unicode_literals

from django import template

# Third-party app imports

# Realative imports of the 'app-name' package


register = template.Library()


@register.filter(name='has_boss') 
def has_boss(user, group_name):
    # return user.groups.filter(name=group_name).exists()
    return user.groups.filter(is_boss=True).exists()

@register.filter(name='has_group') 
def has_group(user):
    # return user.groups.filter(name=group_name).exists()
    # return user.groups.values_list('name', flat=True)
    return user.groups.values('name')[0]['name']


# @register.filter(name='has_boss')
# def has_boss(user, user_boss):
#     groups = user.groups.all().values_list('is_boss', flat=True)
#     print(groups)
#     return True if user_boss in groups else False
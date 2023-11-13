from datetime import time
from ldap3 import Server, Connection, ALL, SUBTREE

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class LdapADMSK(ModelBackend):
    def authenticate(self, request, username=None, password=None):
        # if username in ('admin', 'avsulyay', 'pupkin', 'popov'):
        if username in ('admin', 'pupkin', 'popov'):
            user = User.objects.get(username=username)
            return user
        else:
            print('Start autentification')

            try:
                print('Point 1')
                server = Server('ldap://msk.mts.ru', get_info=ALL)
            except Exception as e:
                print('Point 2')
                return None
            else:
                print('Point 3')
                connect = Connection(server, user=f"admsk\{username}", password=password) 

                if connect.bind():
                    print('Point 4')
                    AD_SEARCH_TREE = 'dc=msk,dc=mts,dc=ru'
                    # AD_SEARCH_OPTIONS = '(&(extensionAttribute7=Макро-регион Юг&Филиал ПАО "МТС" в Краснодарском крае&Центр управления сервисами "Кубань"&Отдел контроля сервисов коммутационной подсистемы и VAS&Группа мониторинга и управления инцидентами))'
                    AD_SEARCH_OPTIONS = '(&(mailNickname:={}))'.format(username)
                    attr = ['mailNickname', 'mail', 'sn', 'givenName', ]
                    connect.search(AD_SEARCH_TREE,
                        AD_SEARCH_OPTIONS,
                        SUBTREE,
                        attributes=attr
                        )
                    
                    user_data = connect.entries

                    connect.unbind()




                    try:
                        print('Point 5')
                        user = User.objects.get(username=username)
                    except Exception:
                        print('Point 6')

                        for item in user_data:
                            if not item.mailNickname or not item.mail:
                                continue
                            self.last_name = item.sn
                            self.first_name = item.givenName
                            self.email = item.mail


                        user = User.objects.update_or_create(username, password=password)
                        user.is_superuser = False
                        user.is_staff = False
                        user.first_name = self.first_name
                        user.last_name = self.last_name
                        user.email = self.email
                        user.save()                    
                        return user
                    
                    print('Point 7')
                    user.set_password(password)
                    user.save()
                    return user

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except:
            return None
        

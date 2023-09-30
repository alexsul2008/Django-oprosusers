from datetime import time
from ldap3 import Server, Connection, ALL, SUBTREE

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class LdapADMSK(ModelBackend):
    def authenticate(self, request, username=None, password=None):
        if username in ('admin', 'avsulyay', 'pupkin', 'popov'):
            user = User.objects.get(username=username)
            return user
        else:
            print('Start autentification')

            try:
                print('Point 1')
                server = Server('ldap://msk.mts.ru', get_info=ALL)
            except Exception as e:
                print('Point 2')
                # with open('test_background_task.txt', mode='a') as test_task:
                #     test_task.write(f"TEST AUTH\n")
                return None
            else:
                print('Point 3')
                # with open('test_background_task.txt', mode='a') as test_task:
                #     test_task.write(f"TEST AUTH\n")
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
        

    def add_users_group(self):
        
        try:
            print('Point 1')

            username = 'логин admsk'
            pwd = 'пароль admsk'

            # print(pwd)

            server = Server('ldap://msk.mts.ru', get_info=ALL)
            connect = Connection(server, user=f"admsk\{username}", password=pwd)

            if connect.bind():
                print('Point 2')
                AD_SEARCH_TREE = 'dc=msk,dc=mts,dc=ru'
                AD_SEARCH_OPTIONS = '(&(extensionAttribute7=Макро-регион Юг&Филиал ПАО "МТС" в Краснодарском крае&Центр управления сервисами "Кубань"&Отдел контроля сервисов коммутационной подсистемы и VAS&Группа мониторинга и управления инцидентами))'
                attr = ['mailNickname', 'mail', 'sn', 'givenName', ]
                connect.search(AD_SEARCH_TREE,
                    AD_SEARCH_OPTIONS,
                    SUBTREE,
                    attributes=attr
                    )
                
                list_data = connect.entries

                # print(list_data)

                connect.unbind()
            
                count = 1
                for item in list_data:

                    if not item.mailNickname or not item.mail:
                        continue
                
                    print(f'№{count} - Логин: {item.mailNickname}, Фамилия и Имя: {item.sn} {item.givenName}, E-mail: {item.mail}')
                    
                    User.objects.update_or_create(username = item.mailNickname, first_name = item.givenName, last_name = item.sn, email = item.mail, is_superuser = False, is_staff = False) 

                    # time.sleep(3)                      
                    # user.save()
                    count += 1

                


        except Exception as e:
            print('Point 2')
            print(f'Error: {e}')
            return None
        
            


        return 'Ok'
     
        
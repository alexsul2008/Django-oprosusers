function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie != '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

let csrftoken = getCookie('csrftoken');



// window.addEventListener('load', dataHover)


$(document).ready(function () {
    var ok = 0;
    var notOk = 0;
    const message = $('.message-join');
    const message_title = $('h5.modal-title');


    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $('body').on('click', '.list-group a.list-group-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = $(this).attr('href');
        var otv = $(this).data('id');
        var vop = $('a.nextVopros.first').attr('data-id');

        if ($(this).attr('data-approved') === 'True' || $(this).attr('data-approved') === 'true') {
            $(this).removeClass('list-group-item-success').addClass('list-group-item-success')
            ok++;
            answerInQuestion(vop, otv, url, 1, 'True');

            localStorage.setItem('otv', otv);
            localStorage.setItem('status', 'list-group-item-success');


        } else {
            $(this).removeClass('list-group-item-danger').addClass('list-group-item-danger')
            notOk++;
            answerInQuestion(vop, otv, url, 0, 'True');

            localStorage.setItem('otv', otv);
            localStorage.setItem('status', 'list-group-item-danger');
        }
        $('div.list-group').removeClass('disabled').addClass('disabled');
    });

    $('body').on('click', 'a.nextVopros', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = $(this).attr('href');
        var id = $(this).data('next');
        var count = $(this).attr('data-i');


        $(this).attr('data-id', '').attr('data-next', '').attr('data-i', '');

        if (!$("div.list-group").hasClass("disabled")) {
            $('#isNotAnsweredModal').modal('show');
        } else {
            localStorage.clear();
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    'csrfmiddlewaretoken': csrftoken,
                    'id': id,
                    'count': count,
                },
                success: function (data) {
                    if (data.flag != 1) {
                        $('#count').text(data.count);
                        $('h4.alert-heading').text(data.questions_list);

                        var answers = JSON.parse(data.answers);

                        $('div.answers').remove();

                        var html = '<div class="row mb-5 answers"><div class="list-group w-100 ">';

                        for (i = 0; i < answers.length; i++) {
                            html += '<a type="button" class="list-group-item list-group-item-action" data-id="' + answers[i].pk + '" data-approved="' + answers[i].fields.approved +
                             '" href="/questionajax/">' + answers[i].fields.description + '</a>';
                        }

                        html += '</div></div>';

                        $('div.question').after(html);

                        $('a.nextVopros').attr('data-i', data.count).attr('data-id', data.id).attr('data-next', data.next);

                    } else {
                        window.location.href = data.url;
                    }
                }
            });
        }
    });

    // $('body').on('click', 'button.user-opros', function (e) {
    //     let button = $(e.relatedTarget);
    //     let opros = $(this).data('opros-user');
    //     let url = $(this).data('url');
    //     let id = $(this).data('id');
    //     let itemCollaps = $('.accordionExampleUserListQuestions').find('#collapse' + id);


    //     $.ajax({
    //         type: 'POST',
    //         url: url,
    //         data: {
    //             'csrfmiddlewaretoken': csrftoken,
    //             'opros': opros,
    //             'opros_id': id,
    //         },
    //         success: function (data) {
    //             let listquests = JSON.parse(data.list_quests);
    //             let html = '';


    //             if (listquests.length != 0) {
                    

    //                 for (i = 0; i < listquests.length; i++) {

    //                     html += '<div class="row">';
    //                     html += '<div class="col-1"></div>';
    //                     html += '<div class="col-11"><h5 class="alert-heading">' + listquests[i].question + '</h5><hr></div>';
    //                     html += '</div>';
    //                     html += '<div class="row mb-5">';
    //                     html += '<div class="col-1"></div>';
    //                     html += '<div class="list-group col-11 disabled">';

    //                                 for (j = 0; j < listquests[i].new_answ.length; j++) {
    //                                     html += '<button type="button" class="list-group-item list-group-item-action';
    //                                     if (listquests[i].new_answ[j].approved === true) {
    //                                         html += ' list-group-item-success"';
    //                                     }
    //                                     if (contains(listquests[i].otv, listquests[i].new_answ[j].id) == true) {
    //                                         html += ' list-group-item-danger"';
    //                                     }
    //                                     html += ' data-id="' + listquests[i].new_answ[j].id + '">' + listquests[i].new_answ[j].description + '</button>';
    //                                 }

    //                     html += '</div>';
    //                     html += '</div>';

    //                 }

    //                 // html += '</div>';

    //             } else {
    //                 html += '<div class="row"><div class="col-1"></div><div class="col-11 align-middle"><p class="mt-3 bg-transparent text-info text-center ">Опрос не проходил(а)</p></div></div>';
    //             };
                
    //             $(itemCollaps).append(html);
    //         }
    //     });
    // });



 

    // Выделить всех пользователей
    $('body').on('click', '.list-group .check-all-user', function () {
        $('.list-group input[name=user-check]').prop('checked', 'checked');
        $('.list-group input[name=user-check]').val('true');
        var userCheck = [];
        $('.list-group input[name=user-check]').each(function (i) {
            userCheck[i] = userAccess($(this).attr('data-user'), 1, $(this).attr('data-url'));
        });
        $(this).addClass('uncheck-all-user');
        $(this).removeClass('check-all-user');
    });

        // Снять выделение со всех  пользователей.
    $('body').on('click', '.list-group .uncheck-all-user', function () {
        $('.list-group input[name=user-check]').prop('checked', false);
        $('.list-group input[name=user-check]').val('false');

        var userUnCheck = [];
        $('.list-group input[name=user-check]').each(function (i) {
            userUnCheck[i] = userAccess($(this).attr('data-user'), 0, $(this).attr('data-url'));
        });
        $(this).addClass('check-all-user');
        $(this).removeClass('uncheck-all-user');
    });

    $('body').on('click', '.list-group input[name=user-check]', function () {
        var user_id = $(this).attr('data-user');
        var url = $(this).attr('data-url');

        if ($(this).prop('checked')) {
            $(this).val('true');
            userAccess(user_id, 1, url);
        } else {
            $(this).val('false');
            userAccess(user_id, 0, url);
        }
    });

    $("button.btn-statistics-user").hover(
        function() {
            $(this).find("span.childrens").removeClass('d-none');
        }, function() {
            $(this).find("span.childrens").addClass('d-none');
        }
    );

    // $("button.btn-settings").hover(
    //     function() {
    //         $(this).find("span.childrens").removeClass('d-none');
    //     }, function() {
    //         $(this).find("span.childrens").addClass('d-none');
    //     }
    // );

    $('.action-list').on('click', 'a.question-active', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var elem = $(this);
        var url = elem.attr('href');
        var in_active = elem.data('in_active');
        var id = elem.data('id');

        $.ajax({
            type: 'POST',
            url: url,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'id': id,
                'in_active': in_active,
            },
            success: function (data) {
                location.reload();
            }
        });
    });
  

    $('#editUserModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var id = button.data('edit-user');
        var container = $(this).find('.modal-user-edit');
        container.html('');

        $.ajax({
            url: url
        }).done(function (data) {
            container.html(data);
        });
    });


    $('#changePasswordUserModal').on('show.bs.modal', function (e) {
        var button = $(e.relatedTarget);
        var url = button.data('url');
        var id = button.data('user-id');
        var container = $(this).find('.modal-user-change-pass');
        container.html('');

        $.ajax({
            url: url,
            id: id
        }).done(function (data) {
            container.html(data);
        });
    });


    $('#deleteUserModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-user-delete');
        container.html('');

        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });

    $('#deleteGroupUserModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-group-user-delete');
        container.html('');

        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });

    $('#exampleAddUserModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-user-add');
        container.html('');

        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        }).fail(function (jqXHR, textStatus) {
            console.log(textStatus);
        });
    });


    $('#exampleAddGroupUserModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-add-group-user');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        }).fail(function (jqXHR, textStatus) {
            console.log(textStatus);
        });
    });

    $('#editGroupUserModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-group-user-edit');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        }).fail(function (jqXHR, textStatus) {
            console.log(textStatus);
        });
    });


    $('#createQuestionModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-create-question');

        // console.log(container);
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });


    $('#editQuestionModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.edit-modal-question');

        // console.log(container);
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });

    $('#deleteQuestionModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-question-delete');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });

    });


    $('#addGroupQuestinModalCenter').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-add-groups-question');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });

    $('#editGroupQuestions').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-edit-groups-question');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });
    });

    $('#deleteGroupQuestions').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var url = button.data('url');
        var container = $(this).find('.modal-groups-question-delete');
        container.html('');
        $.ajax({
            url: url,
        }).done(function (data) {
            container.html(data);
        });

    });


    $('body').on('click', '.select-image', function(){
        if($('.imgclear').lenght > 0) {
            $('.imgclear').remove();
        };
        $('.delete-image').removeClass('disabled');
        $(this).next('.imgfile').click();
    });

    $('body').on('click', 'a.delete-image', function () {
        var field_name = $('.imgfile')[0].getAttribute('name');
        var images = $(this).closest('.fileinput').find('img.uploaded-images');
        images.animate({opacity: 0}, 500, 'linear', function(){images.attr('src', deleteSRCimages())}).animate({opacity: 0}, 900, 'linear');
        $(this).addClass('disabled')

        $('.imgfileinput').append('<input id="imgclear" type="hidden" name="' + field_name + '-clear" value="on">');
    });

//    $('body').on('click', '#imgremove', function () {
//        var field_name = $('#imgfile')[0].getAttribute('name');
//        $('#imgfileinput').append('<input id="imgclear" type="hidden" name="' + field_name + '-clear" value="on">');
//    });
//
//    $('body').on('click', '#imgselect', function () {
//        $('#imgclear').remove();
//    });

    $('#messageModalCenter').on('hidden.bs.modal', function (e) {
        $('#messageModalCenter .message-join h5').empty();  
    });

    $('body').on('click', 'a.delete-user-statics', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = $(this).data('url');
        var id = $(this).data('id');
        var parent = $(this).parent().parent().parent().parent();

        confirm_box = confirm("Удалить данную запись?");

        if (confirm_box == true) {
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    'csrfmiddlewaretoken': csrftoken,
                    'pk': id,
                },
                success: function (data) {
                    var msg = JSON.parse(data.message);
                    var title = JSON.parse(data.title);
                    parent.remove();
                    message_title.empty();
                    message_title.append(title);
                    message.empty();
                    message.append('<p class="text-secondary pt-2">' + msg + '</p>');
                    $('#exampleModalMessages').modal({show: true});
                }
            });
        } else {

        }

    });


});

const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-outline-info mr-2',
      cancelButton: 'btn btn-outline-danger'
    },
    buttonsStyling: false
  })

if(document.querySelector('#accordExample')){
    document.querySelector('#accordExample').addEventListener('click', function(elem) {
        
        if(!elem.target.dataset.delete){
            return
        }

        let textContentCount = elem.target.closest('div[id^="heading_"]').querySelector('span.badge[data-count]')
        let collapsedContent = elem.target.closest('div[id^="heading_"]').querySelector('div[id^="collapse_"]')

        swalWithBootstrapButtons.fire({
            title: 'Внимание',
            text: 'Вы действительно хотите удалить данную статистику?',
            icon: 'error',
            iconHtml: '?',
            showCancelButton: true,
            confirmButtonText: 'Да',
            cancelButtonText: 'Отмена',
        }).then((result) =>{
            if(result.isConfirmed){
                $.ajax({
                    type: 'POST',
                    url: elem.target.dataset.url,
                    data: {
                        'csrfmiddlewaretoken': csrftoken,
                        'pk': elem.target.dataset.delete,
                    },
                    success: function (data) {                    
                        let data_keys = JSON.parse(data.key)
                        let lists = JSON.parse(localStorage.getItem('lists_answer')) || []
                        
                        localStorage.removeItem(data_keys)
                        document.getElementById('heading' + elem.target.dataset.delete).remove() 
                        
                        if(lists.lenght != 0){
                            let index = lists.indexOf(data_keys)
                            
                            lists.splice(index, 1)
                            localStorage.setItem('lists_answer', JSON.stringify(lists))
                        }

                        textCount = Number(textContentCount.textContent) - 1
                        textContentCount.textContent = textCount

                        let closetCount = textContentCount.closest('div[class^="col"')
                        let nextElCount = closetCount.nextElementSibling

                        if(textCount === 0){
                            closetCount.classList.add('col-4')
                            closetCount.classList.remove('col-2')
                            closetCount.innerHTML = '<small class="text-center text-wrap">Опрос не проходил(а)</small>'
                            nextElCount.remove()
                            collapsedContent.remove()
                            
                        }                        
                        swalWithBootstrapButtons.fire(
                            "Удалено!",
                            "Выбранная статистика успешно удалёна.",
                            "success"
                        )
                    }
                });
                
                
                
            }
        })
        
    })
}






const formLoginErrors = () => {
    if(document.querySelector('#user-logining ul') !== null){
        document.querySelector('#user-logining ul').classList.add('list-unstyled')
    }else{
        return
    }   
}
formLoginErrors()

function selectClass(elem, classes=[]){
    if(elem.classList.contains(...classes)){
        elem.classList.remove(...classes);
    }else {
        elem.classList.add(...classes);
    }
}

let messagesInference = (text=null, tags=null) => {
    const messageModalWin = new bootstrap.Modal(document.querySelector('#messageModalCenter'))
    const messageModalView = document.querySelector('#messageModalCenter .modal-header') 
    const messageModalBtn = document.querySelector('#messageModalCenter .modal-footer button') 
    const messageModalIcon = document.querySelector('#messageModalCenter .message-join i')
    let messageText = document.querySelector('#messageModalCenter .message-join h5')
  
    switch (tags) {
        case 'success':
            selectClass(messageModalView,['bg-info'])
            selectClass(messageModalBtn,['btn-outline-info']) 
            selectClass(messageModalIcon,['fa-check-circle-o', 'text-info'])      
            break
        case 'error':
            selectClass(messageModalView,['bg-danger'])
            selectClass(messageModalBtn,['btn-outline-danger']) 
            selectClass(messageModalIcon,['fa-exclamation', 'text-danger'])          
            break    
        default:
            break;
    }

    if(text){
        messageText.innerHTML = text

        if (messageText.length != 0){
            messageModalWin.show()
        }
    }


}

const collapseOtvet = (id, oprosed, user=null) => {
    // console.log(id)
    // console.log(oprosed)
    let opros = oprosed
    let button = document.getElementById('heading' + id)
    let url = button.getAttribute('data-url')
    let lists_answer

    if(!user){
        lists_answer = 'lists_answer'
    }else{
        lists_answer = 'lists_answer_' + user
    }

    let lists = JSON.parse(localStorage.getItem(lists_answer)) || []

    if(lists.indexOf(opros) == -1){
        lists.push(opros)
    }    
    
    localStorage.setItem(lists_answer, JSON.stringify(lists))

    if(!localStorage.getItem(opros)){
     
        $.ajax({
            type: "POST",
            url: url,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'opros_id': id,
                'val': opros
            },
            cache: false,
            dataType: 'json',
            success: function (data) {
                // console.log(data)
                localStorage.setItem(opros, JSON.stringify(data))
                viewListsQuestion(id, opros)
            }
        });
        
    }else{
        viewListsQuestion(id, opros)
    }
    
}

const viewListsQuestion = (id=None, row=None) => {
    let collapsed = document.getElementById('collapse' + id) 
    collapsed.innerHTML = ''   

    if(!collapsed.classList.contains('show')){
        let dataRow = JSON.parse(localStorage.getItem(row))        

        for (let i=0; i<dataRow['answers'].length; i++){
            collapsed.insertAdjacentHTML('beforeend', `
                <div class="flex-row mt-2 mb-3 item-question" data-vop="${dataRow['answers'][i]['vop_id']}">
                    <h5 class="alert-heading pt-2 pb-2 pl-3 pl-3">${dataRow['answers'][i]['vop__description']}</h5>
                </div>               
            `) 

            let answers = ''
            answers = document.querySelector(`[data-vop="${dataRow['answers'][i]['vop_id']}"]`)

            for (let j=0; j<dataRow['answers'][i]['otv'].length; j++){
                let success = ''
                 
                let id = Number(dataRow['answers'][i]['otv'][j]['id'])               
                if(dataRow['answers'][i]['otv'][j]['approved']){
                    success = 'list-group-item-success'
                }   
                
                let danger = ''
                if(!dataRow['answers'][i]['correct'] && (dataRow['answers'][i]['otv_id'] == id)){                
                    danger = 'list-group-item-danger'
                }
                answers.insertAdjacentHTML('beforeend', `
                <button type="button" class="list-group-item list-group-item-action ${success} ${danger}"
                    data-id="${dataRow['answers'][i]['otv'][j]['id']}">${dataRow['answers'][i]['otv'][j]['description']}</button>
                `)
            }
        }

    }else{
        console.log('Закрыт')
    }
}


const userLogout = () => {
    let lists = JSON.parse(localStorage.getItem('lists_answer')) || []
    if(lists.lenght != 0){
        lists.forEach(function(item, i) {
            localStorage.removeItem(item)
        })
        localStorage.removeItem('lists_answer')
    } else {
        localStorage.removeItem('lists_answer')
    }   
}

const groupsUser = () => {
    const listGroupUsers = document.getElementById('list-group-users')
    const url = listGroupUsers.dataset.url

    $.ajax({
        type: 'GET',
        url: url,        
        success: function (data) {             
            let groupUsers = JSON.parse(data.groups_user)  
            
            if(groupUsers.length != 0){
                for(let i=0; i<groupUsers.length; i++){
                    let is_boss = ''
                    if (groupUsers[i]['is_boss']){
                        is_boss = '<i class="fa fa-user-secret" aria-hidden="true"></i>'
                    }

                    listGroupUsers.insertAdjacentHTML('beforeend', `
                    <button class="btn-settings btn btn-outline-info btn-lg btn-block" type="button" data-hover="hover">
                        <div class="row">
                            <div class="col-1 pl-0 pr-0">${is_boss}</div>
                            <div class="col-7 pl-0 text-left">
                                <span class="badge m-1">${groupUsers[i]['name']}</span>
                            </div>
                            <div class="col-4 text-right">
                                
                                <span class="childrens p-0">
                                    <span class="fa fa-pencil btn btn-sm btn-light p-1 edit-group-user"
                                        style="width: 29x; height: 29px;"
                                        role="button"
                                        aria-pressed="true"
                                        data-toggle="modal"                                    
                                        data-url="${groupUsers[i]['url']}"
                                        data-target="#editGroupUserModal"
                                        title="Редактировать группу пользователей">
                                    </span>
                                    

                                    <span class="fa fa-trash delete-group-user btn btn-sm btn-danger p-1"
                                        style="width: 29px; height: 29px;"
                                        role="button"
                                        aria-pressed="true"
                                        data-url="${groupUsers[i]['url']}"
                                        data-toggle="modal"
                                        data-target="#deleteGroupUserModalCenter"
                                        title="Удалить группу пользователей">
                                    </span>
                                </span>
                                
                            </div>
                            
                        </div>
                    </button>
                    `)
                }
            }           
            
        }
    })
    // const elements = dataHover()
    // console.log(elements)
}





// function dataHoverOver(){
//     document.querySelector('#list-group-users').addEventListener('mouseover', function(e) {    
//         const hover = e.target.dataset.hover
//         if(hover === 'hover'){
//             console.log(hover.currentTarget)
//             const node = e.target.querySelector('.childrens')
//             node.classList.remove('d-none') 
//         }
//     })   
// }

// function dataHoverOut(){
//     document.querySelector('#list-group-users').addEventListener('mouseout', function(e) {    
//         const hover = e.target.dataset.hover
//         if(hover === 'hover'){
//             console.log(hover.currentTarget)
//             const node = e.target.querySelector('.childrens')
//             node.classList.add('d-none') 
//         }
//     })   
// }



// window.addEventListener("load", (event) => {
//     console.log("page is fully loaded");
//     dataHoverOver()
//     dataHoverOout()
//   });


// 

// const el = document.getElementById('list-group-users');

// const dataAttrs = el.getAttributeNames().reduce((obj, name) => {
//   if (name.startsWith('data-')) {
//     return {...obj, [name.slice(name.indexOf('-') + 1)]: el.getAttribute(name)};
//   }
//   return obj;
// }, {});

// console.log(dataAttrs)




// const btnEnter = document.getElementsByClassName('btn-settings')



// btnEnter.forEach(function(element) {
//     console.log(element)
//  });

// document.getElementById('list-group-users').addEventListener('mouseenter', function(e) {    
//     const hover = e.target.dataset.hover
//     console.log(hover)
//     if(hover === 'hover'){
//         console.log(hover)
//         const node = e.target.querySelector('span.childrens')
//         node.classList.toggle('d-none')  
        
//         // if(node.classList.contains("d-none")) {
//         //     node.classList.remove("d-none");
//         // }
//         // else {
//         //     node.classList.add("d-none");
//         // }       

//     }      
    
// })
// function bounce(letter) {
//     console.log(letter)
//     if (!letter.classList.contains("d-none")) {
//         letter.style.classList.add("d-none");
//         setTimeout(
//             function () {
//                 letter.classList.remove("d-none");
//             },
//             200
//         );
//     }
// }

// const container = document.querySelector("#list-group-users");
// const matches = container.querySelectorAll("span.childrens")

// console.log(matches.typeNode)


// document.querySelectorAll("button.btn-settings>span.childrens").forEach((element) => {
//     console.log(element)
//     element.addEventListener("mouseover", (e) => bounce(e.target));
// });
  







// document.getElementById('list-group-users').addEventListener('mouseleave', (e) => {    
//     const hover = e.target.dataset.hover
//     if(hover === 'hover'){
//         const node = e.target.querySelector('span.childrens')
//         node.classList.add('d-none')        
//     }
// })

// $("button.btn-settings").hover(
//     function() {
//         $(this).find("span.childrens").removeClass('d-none');
//     }, function() {
//         $(this).find("span.childrens").addClass('d-none');
//     }
// );


function deleteSRCimages(){
    const img_src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOTAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTkwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijk1IiB5PSI3MCIgc3R5bGU9ImZpbGw6I2FhYTtmb250LXdlaWdodDpib2xkO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO2RvbWluYW50LWJhc2VsaW5lOmNlbnRyYWwiPjE5MHgxNDA8L3RleHQ+PC9zdmc+';
    return img_src;
}



function contains(arr, elem) {
    // console.log(arr);
    // console.log(elem);
    // console.log('*****************************');
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === elem) {
            return true;
        }
    }
    return false;
}

function answerInQuestion(vop, otv, url, correct, answered) {
    let data = {};
    data.correct = correct;
    data.vop = vop;
    data.otv = otv;
    data.answered = answered;
    data.csrfmiddlewaretoken = csrftoken;
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        success: function (data) {
            if (data.is_answered) {
                $('#isAnsweredModal').modal('show');
            }
        }
    });
}

    /*
     * Переключатель доступа пользователя
     */
function userAccess(user_id, val, url) {
    $.ajax({
        type: "POST",
        url: url,
        data: {
            'csrfmiddlewaretoken': csrftoken,
            'user_id': user_id,
            'val': val
        },
        cache: false,
        dataType: 'json',
        success: function (data) {
        }
    });
}

function formFilterInUsers() {
    let forma = $('form#filters-in-users')
    let url = forma.data('url');
    let arr = $('form#filters-in-users input'), obj = {};
    $.each(arr, function (index, el) {
        obj[el.name] ? obj[el.name].push(el.value) : (obj[el.name] = [el.value]);
    });

    var objchec = '';
    forma.find('input[name="groups"]:checked').each(function () {
        label = $("label[for='" + $(this).attr('id') + "']").data('value');
        objchec += '' + label + ', ';
    });
    objchec += '';

    forma.find('p.selectedUsersValueList').text(objchec.slice(0, -2));

    totalSelectedGroupsInFilter(objchec, forma.find('small.totalSelectedUsersValues'));

    $.ajax({
        type: 'POST',
        url: url,
        data: {
            'csrfmiddlewaretoken': csrftoken,
            'data': JSON.stringify(obj),
        },
        success: function (data) {
            let users = JSON.parse(data.users);
            // console.log(users);
            let is_permits = JSON.parse(data.is_permits);
            for (let i = 0; i < users.length; i++) {
                $('span.groups_id_' + users[i]['id']).text(users[i]['total']);
            }
            for (let j = 0; j < is_permits.length; j++) {
                $('span.is_permits_id_' + j).text(is_permits[j][0]['total']);
            }
        }
    });


}

function totalSelectedGroupsInFilter(totalselected, inputtext) {
    let totalselectgroup = parseInt($.trim(totalselected).split(',').length) - 1;
    inputtext.text(totalselectgroup);
}


function formFilterInQuestions() {
    let forma = $('form#filters-in-questions')
    let url = forma.data('url');
    let arr = $('form#filters-in-questions input'), obj = {};
    $.each(arr, function (index, el) {
        obj[el.name] ? obj[el.name].push(el.value) : (obj[el.name] = [el.value]);
    });

    let objchec = '';
    forma.find('input[name="groups_questions"]:checked').each(function () {
        label = $("label[for='" + $(this).attr('id') + "']").data('value');
        objchec += '' + label + ', ';
    });
    objchec += '';

    forma.find('p.selectedGroupsQuestionsValueList').text(objchec.slice(0, -2));
    totalSelectedGroupsInFilter(objchec, forma.find('small.totalSelectedGroupsQuestionsValues'));

    $.ajax({
        type: 'POST',
        url: url,
        data: {
            'csrfmiddlewaretoken': csrftoken,
            'data': JSON.stringify(obj),
        },
        success: function (data) {
            let groups_questions = JSON.parse(data.groups_questions);
            let in_active = JSON.parse(data.in_active);
            let doc_url = JSON.parse(data.doc_url);
            for (let i = 0; i < groups_questions.length; i++) {
                $('span.groups_questions_id_' + groups_questions[i]['id']).text(groups_questions[i]['total']);
            }
            for (let j = 0; j < in_active.length; j++) {
                $('span.in_active_id_' + [j]).text(in_active[j][0]['total']);
            }
            for (let d = 0; d < doc_url.length; d++) {
                $('span.doc_url_id_' + [d]).text(doc_url[d][0]['total']);
            }
        }
    });


}







function chartitInUsers() {
    let chart = $('#container-highcharts-ajax1')
    let url = chart.data('url');
    // console.log(url);

    $.ajax({
        type: 'POST',
        url: url,
        data: {
            'csrfmiddlewaretoken': csrftoken,
        },
        success: function (data) {
            // console.log(data);
            let totalusers = JSON.parse(data.total_users_groups);
            let totalquestions = JSON.parse(data.total_questions_groups);

            // console.log(totalusers);
            // console.log(totalquestions);
            Highcharts.chart('container-highcharts-ajax1', {
                chart: {
                    backgroundColor: 'transparent',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    marginRight: 200,
                    type: 'pie'
                },
                title: {
                    text: 'Количественный состав групп',
                    style: {"color": "#f8f9fa", "fontSize": "18px", "text-transform": "uppercase"}
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name} </span>',
                    pointFormat: '<span style="font-size: 14px; font-weight: bold">{point.name}</span>: <b>{point.y} чел.</b><br/>'
                },
                // отключает ссылку на Hightchart.com
                credits: {enabled: false},
                legend: {
                    enabled: true,
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    x: 0,
                    y: 50,
                    itemStyle: {
                        "color": "#f8f9fa",
                        "cursor": "pointer",
                        "fontSize": "16px",
                        "textOverflow": "ellipsis"
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: 15,
                    borderRadius: 5,
                    borderWidth: 2,
                    labelFormat: '<span style="font-size: 13px;">{name}</span>: <b>{y} чел.</b><br/>',
                    itemStyle: {
                        color: '#E0E0E3'
                    },
                    itemHoverStyle: {
                        color: '#F6F6F6'
                    },
                    itemHiddenStyle: {
                        color: '#606063'
                    },
                    title: {
                        style: {
                            color: '#f8f9fa'
                        }
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    }
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            // enabled: false
                            menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "separator", "downloadPDF", "downloadXLS", "downloadCSV"],
                            symbolStroke: "#333333"
                        }
                    }
                },
                lang: {
                    contextButtonTitle: "Дополнительные действия",
                    viewFullscreen: "На весь экран",
                    printChart: "Распечатать график",
                    downloadCSV: "Выгрузить в формате CSV",
                    downloadJPEG: "Выгрузить в формате JPEG",
                    downloadPNG: "Выгрузить в формате PNG",
                    downloadPDF: "Выгрузить в формате PDF",
                    downloadXLS: "Выгрузить в формате XLS",
                    exitFullscreen: "Выйти из полноэкранного режима"
                },
                series: [{
                    name: 'Группа',
                    colorByPoint: true,
                    data: totalusers
                }]
            });


            Highcharts.chart('container-highcharts-ajax2', {
                chart: {
                    backgroundColor: 'transparent',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    marginRight: 200,
                    type: 'pie'
                },
                title: {
                    text: 'Количество вопросов по группам',
                    style: {"color": "#f8f9fa", "fontSize": "18px", "text-transform": "uppercase"}
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name} </span>',
                    pointFormat: '<span style="color:{point.color}"><b>{point.name}</b></span>: <b>{point.y} вопросов.</b><br/>'
                },
                // отключает ссылку на Hightchart.com
                credits: {enabled: false},
                legend: {
                    enabled: true,
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    x: 0,
                    y: 50,
                    itemStyle: {
                        "color": "#f8f9fa",
                        "cursor": "pointer",
                        "fontSize": "16px",
                        "textOverflow": "ellipsis"
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: 15,
                    borderRadius: 5,
                    borderWidth: 2,
                    labelFormat: '<span style="font-size: 13px">{name}</span>: <b>{y} вопр.</b><br/>',
                    itemStyle: {
                        color: '#E0E0E3'
                    },
                    itemHoverStyle: {
                        color: '#F6F6F6'
                    },
                    itemHiddenStyle: {
                        color: '#606063'
                    },
                    title: {
                        style: {
                            color: '#C0C0C0'
                        }
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    }
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            // enabled: false
                            menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "separator", "downloadPDF", "downloadXLS", "downloadCSV"],
                            symbolStroke: "#333333"
                        }
                    }
                },
                lang: {
                    contextButtonTitle: "Дополнительные действия",
                    viewFullscreen: "На весь экран",
                    printChart: "Распечатать график",
                    downloadCSV: "Выгрузить в формате CSV",
                    downloadJPEG: "Выгрузить в формате JPEG",
                    downloadPNG: "Выгрузить в формате PNG",
                    downloadPDF: "Выгрузить в формате PDF",
                    downloadXLS: "Выгрузить в формате XLS",
                    exitFullscreen: "Выйти из полноэкранного режима"
                },
                series: [{
                    name: 'Группа',
                    colorByPoint: true,
                    data: totalquestions

                }]
            });
        }
    });

}

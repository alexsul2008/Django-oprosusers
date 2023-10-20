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
    // $('body').on('click', '.list-group .check-all-user', function () {
    //     $('.list-group input[name=user-check]').prop('checked', 'checked');
    //     $('.list-group input[name=user-check]').val('true');
    //     var userCheck = [];
    //     $('.list-group input[name=user-check]').each(function (i) {
    //         userCheck[i] = userAccess($(this).attr('data-user'), 1, $(this).attr('data-url'));
    //     });
    //     $(this).addClass('uncheck-all-user');
    //     $(this).removeClass('check-all-user');
    // });

    //     // Снять выделение со всех  пользователей.
    // $('body').on('click', '.list-group .uncheck-all-user', function () {
    //     $('.list-group input[name=user-check]').prop('checked', false);
    //     $('.list-group input[name=user-check]').val('false');

    //     var userUnCheck = [];
    //     $('.list-group input[name=user-check]').each(function (i) {
    //         userUnCheck[i] = userAccess($(this).attr('data-user'), 0, $(this).attr('data-url'));
    //     });
    //     $(this).addClass('check-all-user');
    //     $(this).removeClass('uncheck-all-user');
    // });

    // $('body').on('click', '.list-group input[name=user-check]', function () {
    //     var user_id = $(this).attr('data-user');
    //     var url = $(this).attr('data-url');

    //     if ($(this).prop('checked')) {
    //         $(this).val('true');
    //         userAccess(user_id, 1, url);
    //     } else {
    //         $(this).val('false');
    //         userAccess(user_id, 0, url);
    //     }
    // });

    // $("button.btn-statistics-user").hover(
    //     function() {
    //         $(this).find("span.childrens").removeClass('d-none');
    //     }, function() {
    //         $(this).find("span.childrens").addClass('d-none');
    //     }
    // );

    // $("button.btn-settings").hover(
    //     function() {
    //         $(this).find("span.childrens").removeClass('d-none');
    //     }, function() {
    //         $(this).find("span.childrens").addClass('d-none');
    //     }
    // );


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


    // $('.action-list').on('click', 'a.question-active', function (e) {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     var elem = $(this);
    //     var url = elem.attr('href');
    //     var in_active = elem.data('in_active');
    //     var id = elem.data('id');

    //     $.ajax({
    //         type: 'POST',
    //         url: url,
    //         data: {
    //             'csrfmiddlewaretoken': csrftoken,
    //             'id': id,
    //             'in_active': in_active,
    //         },
    //         success: function (data) {
    //             location.reload();
    //         }
    //     });
    // });


});


const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-outline-info mr-2 pl-4 pr-4',
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





const element = (tag, classes = [], content) => {
    const node = document.createElement(tag)

    if (classes.length){
        node.classList.add(...classes)
    }

    if(content){
        node.textContent = content
    }
    return node
}

// function noop() {}

// const upload = (selector, options={}) => {
//     const onUpload = options.onUpload ?? noop
//     const input = document.querySelector(selector)

//     const openBtn = element('button', ['btn', 'btn-outline-info'], 'Открыть')
//     const spanFilesName = element('span', ['w-100', 'text-left', 'p-1', 'span-file-name'], 'Файл для загрузки не выбран')

//     if (options.accept && Array.isArray(options.accept)){
//         input.setAttribute('accept', options.accept.join(', '))
//     }
    
//     input.insertAdjacentElement('afterend', spanFilesName)
//     input.insertAdjacentElement('afterend', openBtn)

//     const triggerInput = (event) => {
//         input.click()  
//         event.preventDefault()
//     }  

//     // const changeHandler = event => {
//     //     console.log(event.target.files.length)
        
//     //     if(!event.target.files.length){
//     //         return
//     //     }
        
//     //     spanFilesName.textContent = event.target.files[0].name

//     //     const filesExel = event.target.files
        
//     //     // const reader = new FileReader()

//     //     // console.log(filesExel)
//     //     // console.log(reader)
        
//     //     // reader.onload = ev => {
//     //     //     console.log(ev.target)
//     //     //     console.log(filesExel)

//     //     // }
        
        
//     // }  


//     openBtn.addEventListener('click', triggerInput)
//     // input.addEventListener('change', changeHandler)
    

// }

// upload('#file', {
//     accept: ['.xlx', '.xlsx']
// })

// let loadFile

// document.getElementById('file').addEventListener('change', function(event){ 
//     console.log('Changeeeeeeee!')
//     const spanFilesName = document.querySelector('.span-file-name')       
//     if(!event.target.files.length){
//         return
//     }        
//     spanFilesName.textContent = event.target.files[0].name
//     loadFile = event.target.files    
// })





document.getElementById('importExelCenter') && document.querySelector('.import-exel').addEventListener('click', () => {
    

    myModal.show()   

    const myForm = document.getElementById('import_exel_form')
    const endpoint = myForm.action
    const btnSubmit = document.querySelector('.btn-submit')
    const btnInputFile = document.querySelector('.input-file input[type=file]')
    const ulInfoList = document.querySelector('.info-list')

    ulInfoList.innerHTML = ''

    
    btnInputFile.addEventListener('change', function(){
        let file = btnInputFile.files[0]
        btnInputFile.closest('.input-file').querySelector('.input-file-text').innerHTML = file.name
        if(!validateSize(btnInputFile, 5)){
            // alert("Файл должен быть не более 5 мегабайт");            
            ulInfoList.insertAdjacentHTML('beforeend', `
            <p class="text-danger">
                    <i class="fa fa-exclamation pr-1" aria-hidden="true"></i>Файл должен быть не более 5 мегабайт</p>
            `)
            btnInputFile.value=""
        }
    })
    
    
    btnSubmit.addEventListener('click', function(e){
    // myForm.addEventListener('submit', function(e) {   
        e.preventDefault()

        let formData = new FormData(myForm)
       
        fetch(endpoint, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // console.log(response)
            response.json()
        })
        .then(data => {
            console.log(data)
            ulInfoList.insertAdjacentHTML('beforeend', `
                <p class="text-secondary"><i class="fa fa-check text-success pr-1" aria-hidden="true"></i>Файл загружен. Идет обработка...</p>
            `)
        }).catch(error => {
            console.error(error);
            alert('Error uploading file');
        })      
    })
})

function validateSize(fileInput,size) {
    let fileObj, oSize

    if ( typeof ActiveXObject == "function" ) { // IE
        fileObj = (new ActiveXObject("Scripting.FileSystemObject")).getFile(fileInput.value);
    }else {
        fileObj = fileInput.files[0];
    }
    
    oSize = fileObj.size; // Size returned in bytes.
    if(oSize > size * 1024 * 1024){
        return false
    }
    return true;
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

const collapseOtvet = (id, oprosed, user=null, event) => {
    console.log(event)
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
    const listGroupQuestions = document.getElementById('list-group-questions')
    const url = listGroupUsers.dataset.url

    $.ajax({
        type: 'GET',
        url: url,
        success: function (data) {
            let groupUsers = JSON.parse(data.groups_user)
            let groupQuestions = JSON.parse(data.groups_question)

            if(groupUsers.length != 0){
                for(let i=0; i<groupUsers.length; i++){
                    let is_boss = groupUsers[i]['is_boss'] ? '<i class="fa fa-user-secret text-success" aria-hidden="true"></i>' : '<i class="fa fa-users text-muted" aria-hidden="true"></i>'

                    listGroupUsers.insertAdjacentHTML('beforeend', `
                    <button class="btn-settings btn btn-outline-info btn-lg btn-block position-relative" type="button" >
                        <div class="d-flex flex-row align-items-center">
                            <div class="wh40">${is_boss}</div>
                            <div class="text-left text-white">
                                <span class="p-2">${groupUsers[i]['name']}</span>
                            </div>
                            <div class="button-overflow justify-content-end">

                                <span class="childrens pr-0">
                                    <span class="wh40 p-0 fa fa-pencil btn btn-sm btn-light edit-group-user"
                                        role="button"
                                        aria-pressed="true"
                                        data-toggle="modal"
                                        data-url="${groupUsers[i]['url']}"
                                        data-target="#editGroupUserModal"
                                        title="Редактировать группу пользователей">
                                    </span>


                                    <span class="wh40 p-0 fa fa-trash delete-group-user btn btn-sm btn-danger"
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

            if(groupQuestions.length != 0){
                for(let i=0; i<groupQuestions.length; i++){
                    let in_active = groupQuestions[i]['in_active'] ? 'text-warning' : 'text-muted'
                    let active = groupQuestions[i]['in_active'] ? 'Деактивировать группу' : 'Активировать группу'
                    let bg_btn = groupQuestions[i]['in_active'] ? 'btn-outline-info' : 'btn-outline-secondary'
                    let btn_active_hover = groupQuestions[i]['in_active'] ? 'btn-outline-warning' : 'btn-outline-secondary'

                    listGroupQuestions.insertAdjacentHTML('beforeend', `
                    <button class="btn-settings btn ${bg_btn} btn-lg btn-block position-relative" type="button" style="min-width: 900px;">
                        <div class="d-flex flex-row justify-content-between align-items-center">
                            <span class="wh40 p-0 fa fa-lightbulb-o ${in_active}" title="${active}"
                                role="button"
                                data-type="activate"
                                data-id="${groupQuestions[i]['id']}"
                                data-secondary></span>
                            <div class="text-left text-white" style="min-width: 200px;">
                                <span class="p-2">${groupQuestions[i]['name']}</span>
                            </div>
                            <div class="button-overflow">
                                <span class="childrens">
                                    <span class="wh40 p-0 fa fa-lightbulb-o btn ${btn_active_hover}" title="${active}"
                                        role="button"
                                        data-type="activate"
                                        data-active="${groupQuestions[i]['in_active']}"
                                        data-id="${groupQuestions[i]['id']}"
                                        data-url-activate="${groupQuestions[i]['url-activate']}"></span>
                                    <span class="wh40 p-0 fa fa-pencil btn btn-sm btn-light p-1 edit-group-questions"
                                        role="button"
                                        aria-pressed="true"
                                        data-toggle="modal"
                                        data-url="${groupQuestions[i]['url']}"
                                        data-target="#editGroupQuestions"
                                        title="Редактировать группу вопросов">
                                    </span>

                                    <span class="wh40 p-0 fa fa-trash delete-group-user btn btn-sm btn-danger p-1"
                                        role="button"
                                        aria-pressed="true"
                                        data-url="${groupQuestions[i]['url']}"
                                        data-toggle="modal"
                                        data-target="#deleteGroupUserModalCenter"
                                        title="Удалить группу вопросов">
                                    </span>
                                </span>

                            </div>
                            <div class="ml-auto text-right" style="min-width: 550px; max-width: 550px;">
                                <span class="list-user-groups" data-group="${groupQuestions[i]['id']}"></span>
                            </div>
                        </div>
                    </button>
                    `)
                    for(let j=0; j<groupQuestions[i]['group_user'].length; j++){
                        let listUserGroups = document.querySelector(`.list-user-groups[data-group="${groupQuestions[i]['id']}"`)
                        listUserGroups.insertAdjacentHTML('beforeend', `
                            <span type="button" class="btn btn-outline-light">${groupQuestions[i]['group_user'][j]['name']}</span>
                        `)
                    }
                }
            }
        }
    })
}

document.addEventListener('click', (event) => {
    const type = event.target.dataset.type
    // console.log(type)
    if(type === 'activate'){
        const icon_secondary = event.target.closest('button').querySelector('span[data-secondary]')
        $.ajax({
            type: "POST",
            url: event.target.dataset.urlActivate,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'activate': 'activate',
                'id': event.target.dataset.id,
                'active': event.target.dataset.active,
            },
            cache: false,
            dataType: 'json',
            success: function (data) {
                let active = JSON.parse(data.active)

                event.target.dataset.active = active

                event.target.classList.remove(active ? 'btn-outline-secondary' : 'btn-outline-warning')
                event.target.classList.add(active ? 'btn-outline-warning' : 'btn-outline-secondary')

                event.target.setAttribute('title', active ? 'Деактивировать группу' : 'Активировать группу')
                event.target.closest('button').classList.remove(active ? 'btn-outline-secondary' : 'btn-outline-info')
                event.target.closest('button').classList.add(active ? 'btn-outline-info' : 'btn-outline-secondary')

                icon_secondary.setAttribute('title', active ? 'Деактивировать группу' : 'Активировать группу')
                icon_secondary.classList.remove(active ? 'text-muted' : 'text-warning')
                icon_secondary.classList.add(active ? 'text-warning' : 'text-muted')



            }
        });
    } else if(type === 'questions'){
        const icon_secondary = event.target.closest('button').querySelector('span[data-secondary]')
        $.ajax({
            type: 'POST',
            url: event.target.dataset.url,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'id': event.target.dataset.id,
                'in_active': event.target.dataset.in_active,
            },
            success: function (data) {
                // console.log(data)
                let in_active = JSON.parse(data.in_active)
                event.target.dataset.in_active = in_active

                event.target.classList.remove(in_active ? 'btn-outline-secondary' : 'btn-outline-warning')
                event.target.classList.add(in_active ? 'btn-outline-warning' : 'btn-outline-secondary')

                event.target.setAttribute('title', in_active ? 'Деактивировать вопрос' : 'Активировать вопрос')
                event.target.closest('button').classList.remove(in_active ? 'btn-outline-secondary' : 'btn-outline-info')
                event.target.closest('button').classList.add(in_active ? 'btn-outline-info' : 'btn-outline-secondary')

                icon_secondary.setAttribute('title', in_active ? 'Деактивировать группу' : 'Активировать группу')
                icon_secondary.classList.remove(in_active ? 'text-muted' : 'text-warning')
                icon_secondary.classList.add(in_active ? 'text-warning' : 'text-muted')

                formFilterInQuestions()
            }
        });
    } else if(type === 'user-check'){        
        const check = event.target
        const user_id = []
        user_id.push(+check.dataset.user)

        $.ajax({
            type: "POST",
            url: check.dataset.url,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'user_id': user_id.toString(),
                'val': check.value
            },
            cache: false,
            dataType: 'json',
            success: function (data) {
                let is_permits = Boolean(JSON.parse(data.is_permits))
                check.setAttribute('value', is_permits)
                check.dataset.permits = is_permits
                is_permits === true ? check.checked = true : check.checked = false

                formFilterInUsers()
                checkUserAccess()
            }
        })        
    } else if(type === 'allpermits'){
        let user_id = dataUsers
        const checks = event.target
        const allUsers = Array.from(document.querySelectorAll('input[name=user-check]'))
        let unchekced = false

        if(checks.dataset.permits){
            unchekced = true            
        }        
        
        $.ajax({
            type: "POST",
            url: checks.dataset.url,
            data: {
                'csrfmiddlewaretoken': csrftoken,
                'user_id': user_id.toString(),
                'val': checks.dataset.permits,
                'unchekced': unchekced
            },
            cache: false,
            dataType: 'json',
            success: function (data) {
                let unchekc = Boolean(JSON.parse(data.unchekced))
                let is_permits = Boolean(JSON.parse(data.is_permits))

                is_permits === true ? checks.checked = true : checks.checked = false
                

                for (let item of allUsers) { 
                    if(unchekc && item.dataset.master === 'false'){                                            
                        item.checked = is_permits
                        item.dataset.permits = is_permits
                    }else{
                        if(user_id.includes(+item.dataset.user) ){ 
                            item.setAttribute('value', is_permits)
                            item.dataset.permits = is_permits
                            is_permits === true ? item.checked = true : item.checked = false
                        }
                    }
                }                
                formFilterInUsers()
                checkUserAccess()

            }
        })    

    }
})

let dataUsers = []
let masterUser = []

// checkUserAccess()

function deleteSRCimages(){
    const img_src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOTAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTkwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijk1IiB5PSI3MCIgc3R5bGU9ImZpbGw6I2FhYTtmb250LXdlaWdodDpib2xkO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO2RvbWluYW50LWJhc2VsaW5lOmNlbnRyYWwiPjE5MHgxNDA8L3RleHQ+PC9zdmc+';
    return img_src;
}


// function contains(arr, elem) {
//     for (let i = 0; i < arr.length; i++) {
//         if (arr[i] === elem) {
//             return true;
//         }
//     }
//     return false;
// }

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

function checkUserAccess() {

    dataUsers = []
    masterUser = []
    
    const allPermits = document.querySelector('input#allpermits')
    const allUsers = Array.from(document.querySelectorAll('input[name=user-check]'))

    for (const item of allUsers) {
        if(item.dataset.master === 'true' ){
            masterUser.push(+item.dataset.user)
        }
       
        if(item.dataset.permits === 'false' && item.dataset.master === 'false'){
            dataUsers.push(+item.dataset.user)
        }
        
        if(dataUsers.length === 0 ){
            allPermits.checked = true
            allPermits.dataset.permits = true
        }else{
            allPermits.checked = false
            allPermits.dataset.permits = false
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    checkUserAccess()
})
// checkUserAccess()



// document.querySelector('input#allpermits').addEventListener('click', function(event){
//     let check = checkUserAccess()
//     // console.log('All checker: ', event.target.dataset, check, typeof check)
//     allUserAccess(event, check)
// })


// function allUserAccess(event, listId) {
//     let allCheck = event.target.dataset.permits

//     $.ajax({
//         type: "POST",
//         url: event.target.dataset.url,
//         data: {
//             'csrfmiddlewaretoken': csrftoken,
//             'user_id': listId.toString(),
//             'val': allCheck
//         },
//         cache: false,
//         dataType: 'json',
//         success: function (data) {
//             allCheck = JSON.parse(data.is_permits)
//             listId.forEach(function(item, i){
//                 // console.log(i, item, allCheck)
//                 let input = document.querySelector(`input[data-user="${item}"]`)
//                 input.dataset.permits = allCheck
//                 input.setAttribute('value', allCheck)
//                 input.setAttribute('checked', 'checked')
//             })
//             formFilterInUsers()
//             checkUserAccess()
//         }
//     });
// }



    /*
     * Переключатель доступа пользователя
     */
// function userAccess(user_id, val, url) {
// function userAccess(event) {
//     console.log(event)
//     const check = event.target
//     const user_id = []
//     user_id.push(Number(check.dataset.user))


//     $.ajax({
//         type: "POST",
//         url: check.dataset.url,
//         data: {
//             'csrfmiddlewaretoken': csrftoken,
//             'user_id': user_id.toString(),
//             'val': check.value
//         },
//         cache: false,
//         dataType: 'json',
//         success: function (data) {
//             let is_permits = JSON.parse(data.is_permits)
//             check.setAttribute('value', is_permits)
//             check.dataset.permits = is_permits
//             formFilterInUsers()
//             // checkUserAccess()
//         }
//     });
// }

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

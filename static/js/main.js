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



    // $('body').on('click', 'span.statistics-user', function () {
    //     var id = $(this).data('user-id');
    //     var url = $(this).data('url');

    //     $.ajax({
    //         type: 'POST',
    //         url: url,
    //         data: {
    //             'csrfmiddlewaretoken': csrftoken,
    //             'pk': id,
    //         },
    //         success: function (data) {
    //             // console.log(data);
    //             var datepassage = JSON.parse(data.date_passage);
    //             var listquests = JSON.parse(data.list_quests);

    //             // console.log(listquests);

    //             var html = '<div class="accordion mb-3 mt-2" id="accordionExampleUserListQuestions">';
    //             if (listquests.length == 0) {
    //                 html += '<div class="row"><div class="col-1"></div><div class="col-11 align-middle"><p class="mt-3 bg-transparent text-info text-center ">Опрос не проходил(а)</p></div></div>';
    //             } else {
    //                 var dp = [];
    //                 datepassage.forEach(function (el, i) {
    //                     datepassage[i].date = new Date(el.date).toLocaleDateString();
    //                     dp.push(datepassage[i].date);
    //                 });
    //                 for (i = 0; i < listquests.length; i++) {
    //                     if (listquests[i].count == 0){
    //                         html += '<div class="card border-0"><div class="" id="heading' + listquests[i].number_opros_id + '">';
    //                         html += '<div class="row mt-1 mb-1"><div class="col-1"></div>';
    //                         html += '<div class="col-11 pl-0">';
    //                         html += '<div class="d-flex flex-row">';
    //                         html += '<div class="align-middle pr-2">';
    //                         html += '<a class="fa fa-trash btn btn-outline-success btn-lg h-100 delete-user-statics" style="font-size: x-large;" role="button" href="" aria-pressed="true" data-url="/statistics/' + listquests[i].number_opros_id + '/delete/" data-toggle="modal" data-target="#deleteQuestionModalCenter" title="Удалить"></a></div>';
    //                         html += '<div class="pl-0 w-100">';
    //                         html += '<button class="btn btn-outline-success btn-lg btn-block opros-user" data-url="oprosanswers/' + listquests[i].number_opros_id + '" data-opros-id="' + listquests[i].number_opros_id + '" type="button" data-toggle="collapse" data-target="#collapse' + listquests[i].number_opros_id + '" aria-expanded="false" aria-controls="collapse' + listquests[i].number_opros_id + '">';
    //                         html += '<div class="row"><div class="col-1"></div>';
    //                         html += '<div class="col-2"><span class="badge float-right m-1">Опрос пройден: </span></div><div class="col-2"><span class="badge badge-light float-left m-1">' + new Date(listquests[i].date_passage).toLocaleDateString() + '</span></div>';
    //                         html += '<div class="col-3"><span class="badge float-right m-1">Верные ответы получены на все: </span></div>';
    //                         html += '<div class="col-1"><span class="badge badge-light w-100 mb-1 mt-1">' + listquests[i].count_all_question + '</span></div>';
    //                         html += '<div class="col-2"><span class="badge float-left m-1">вопроса(ов), а это</span></div>';
    //                         html += '<div class="col-1"><span class="badge badge-light float-left w-100 m-1">100 %</span></div></div>';
    //                         html += '</div></div></button></div></div></div></div>';
    //                     }else{
    //                         html += '<div class="card border-0"><div class="" id="heading' + listquests[i].number_opros_id + '">';
    //                         html += '<div class="row mt-1 mb-1"><div class="col-1"></div>';
    //                         html += '<div class="col-11 pl-0">';
    //                         html += '<div class="d-flex flex-row">';
    //                         html += '<div class="align-middle pr-2">';
    //                         html += '<a class="fa fa-trash btn btn-outline-danger btn-lg h-100 delete-user-statics" style="font-size: x-large;" role="button" href="" aria-pressed="true" data-url="/statistics/' + listquests[i].number_opros_id + '/delete/" data-toggle="modal" data-target="#deleteQuestionModalCenter" title="Удалить"></a></div>';
    //                         html += '<div class="pl-0 w-100">';
    //                         html += '<button class="btn btn-outline-danger btn-lg btn-block opros-user" data-url="oprosanswers/' + listquests[i].number_opros_id + '" data-opros-id="' + listquests[i].number_opros_id + '" type="button" data-toggle="collapse" data-target="#collapse' + listquests[i].number_opros_id + '" aria-expanded="false" aria-controls="collapse' + listquests[i].number_opros_id + '">';
    //                         html += '<div class="row"><div class="col-1"></div>';
    //                         html += '<div class="col-2"><span class="badge float-right m-1">Опрос пройден: </span></div><div class="col-2"><span class="badge badge-light float-left m-1">' + new Date(listquests[i].date_passage).toLocaleDateString() + '</span></div>';
    //                         html += '<div class="col-2"><span class="badge float-right m-1">Не верных ответов на: </span></div>';
    //                         html += '<div class="col-2 d-flex flex-row"><span class="badge badge-light w-100 mb-1 mt-1">' + listquests[i].count + '</span>';
    //                         html += '<span class="badge m-1">из</span><span class="badge badge-light w-100 mb-1 mt-1">' + listquests[i].count_all_question + '</span></div>';
    //                         html += '<div class="col-2"><span class="badge float-left m-1">вопроса(ов), а это</span></div>';
    //                         html += '<div class="col-1"><span class="badge badge-light float-left w-100 m-1">' + listquests[i].percents + ' %</span></div></div>';
    //                         html += '</div></button></div></div></div></div>';
    //                         html += '<div id="collapse' + listquests[i].number_opros_id + '" style="transition: .6s;" class="collapse" aria-labelledby="heading' + listquests[i].number_opros_id + '" data-parent="#accordionExampleUserListQuestions"><div class="card-body">';

    //                         for (j = 0; j < listquests[i].vop.length; j++) {
    //                             html += '<div class="row"><div class="col-1"></div><div class="col-11"><h5 class="alert-heading">' + listquests[i].vop[j].question + '</h5><hr></div></div>';
    //                             html += '<div class="row mb-5"><div class="col-1"></div><div class="list-group col-11 disabled">';


    //                             for (jj = 0; jj < listquests[i].vop[j].new_answ.length; jj++) {
    //                                 html += '<button type="button" class="list-group-item list-group-item-action';
    //                                 if (listquests[i].vop[j].new_answ[jj].approved === true) {
    //                                     html += ' list-group-item-success"';
    //                                 }
    //                                 if (contains(listquests[i].vop[j].otv, listquests[i].vop[j].new_answ[jj].id) == true) {
    //                                     html += ' list-group-item-danger"';
    //                                 }
    //                                 html += ' data-id="' + listquests[i].vop[j].new_answ[jj].id + '">' + listquests[i].vop[j].new_answ[jj].description + '</button>';
    //                             }
    //                             html += '</div></div>';
    //                         }
    //                         html += '</div></div></div>';
    //                     }
    //                 }
    //             };
    //             html += '</div>';
    //             $('div#accordionExampleUserListQuestions').remove();
    //             // parent.empty();
    //             $('div#containerAllAnswerUser_' + data.user_id).after(html);
    //             // parent.empty();

    //         }
    //     });

    // });



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
            $("small#hint_id_password").children("a").addClass("password_user");
        });
    });


    $('#changePasswordUserModal').on('show.bs.modal', function (e) {
        var button = $(e.relatedTarget);
        var url = button.data('url');
        var id = button.data('user-id');
        var container = $(this).find('.modal-user-change-pass');
        container.html('');

        console.log(url);
        console.log(id);

        $.ajax({
            url: url,
            id: id
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

        console.log(button);
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


});


function deleteSRCimages(){
    const img_src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOTAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTkwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijk1IiB5PSI3MCIgc3R5bGU9ImZpbGw6I2FhYTtmb250LXdlaWdodDpib2xkO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO2RvbWluYW50LWJhc2VsaW5lOmNlbnRyYWwiPjE5MHgxNDA8L3RleHQ+PC9zdmc+';
    return img_src;
}

function contains(arr, elem) {
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

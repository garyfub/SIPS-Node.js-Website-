// add next button to all screens but last
$("article").append('<a class="next" href="#">Next</a>');
// add next button to all screens but last
$("article:not(:first)").append('<a class="prev" href="#">Previous</a>');
//hide every form section except first
$("article:nth-child(1n+2)").hide();
//add class of visible to first screen
$("article:first").addClass("visible");
//add an empty unordered list to be populated below
//$("#slider").append("<ul id='page'></ul>");

//Make all questions required
$('form :input').not(':image, :button, :submit, :reset, :hidden, .notRequired').addClass('required');

//start the index at 1
var questionNum = 1;
var currentPage=1;
var newInjuryQuestion = 13;
var Part1NumQuestions = $('.part1').length;
var Part2NumQuestions = $('.part2').length;
var versionText = " over the past 12 months?/during the past season?";
var newName = 'arr[]';
//go through each section (article) and add a list item to the empty unorderd list with the page number

$(".part1").each(function(){
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_'+questionNum+'"><a href="#">Question: '+questionNum + ' of '+Part1NumQuestions+ '</a></li>');
    $(this).addClass("Question" + questionNum);
    questionNum++;
});
$('#page > li').hide();


// Show or Hide 'Other' on Injury Type question
function checkvalue(obj)
{
    val = obj.value;
    if(val==="6" || val==="")
        $('.other').show();
    else
        $('.other').hide();
}
function switchbtn(obj){
    val = obj.value;
    if(val === "0"){
        $('.next').hide();
        $('.submit').show();
    }
    else{
        $('.next').show();
        $('.submit').hide();
    }
}


$("form").validate({
    errorPlacement: function(error, element) {
        error.appendTo('article > div');
    },
    errorClass: "error-required",
    highlight: function(element, errorClass) {
        $(element).removeClass(errorClass);
    }
});

//each time the user clicks the next button, remove the visible class, hide that section, fade in the next question with a new class of visible
$(document).on("click",'.next', function(e){
    e.preventDefault();
    $(".error-required").remove();
    if($('input[name= \"arr['+ currentPage+ ']\"]').valid()) {
        if (currentPage == newInjuryQuestion) {
            var selec = '#apage_' + newInjuryQuestion + ' input[type="radio"]:checked';
            console.log(selec);
            var isInjury = $(selec).val();
            if (isInjury == 1) {
                addInjuryQuestions();//Add questions for new injury
                Part2NumQuestions = $('.part2').length;
            }
            else if (isInjury == 0) {
                //TODO move to final article for submission
            }
        }


        //Switch to show the next questions are on part 2
        if (currentPage == 11) {
            $('#part_indicator').remove();
            $('#progress-container').append('<p id="part_indicator">Part 2: Injury Checklist</p>');
        }
        $(this).closest("article").removeClass("visible").hide().next().addClass("visible").fadeIn();
        currentPage++;

        showCurrentTab();
    }
});
//each time the user clicks the next previous, remove the visible class, hide that section, fade in the prior question with a new class of visible
$(document).on("click",".prev", function(e){
    e.preventDefault();
    $(this).closest("article").removeClass("visible").hide().prev().addClass("visible").fadeIn();
    currentPage--;
    showCurrentTab();
});

function showCurrentTab(){
    $('.questiontab').hide();
    $('#questiontab_'+currentPage).show();
}

//Adds new questions on the page for a new injury
//TODO: Generate Injury Type, Injury Location, Time Loss, and Other Injury questions.
function addInjuryQuestions(){

    //Add Injury Location
    var num = currentPage + 1;
    newID = 'q' + num;
    newName = 'arr[' + num +']';
    $("article:last").closest("article").removeClass("visible").hide();
    $(".form-group").append('<article id="apage_' + num + '" class="part2 Question' + num + '">' +
        ' <label class=" control-label h4" for="' + newID + '">Where was the injury located?</label>' +
        '<div class="">' +
        '<label class="radio-inline" for="' + newID + '-1">'+
        '<input name="' + newName + '" class="required" value="1" type="radio" id="' + newID + '-1">'+
        'Foot/Toe'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-2">'+
        '<input name="' + newName + '" class="required" value="2" type="radio" id="' + newID + '-2">'+
        'Ankle'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-3">'+
        '<input name="' + newName + '" class="required" value="3" type="radio" id="' + newID + '-3">'+
        'Lower Leg'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-4">'+
        '<input name="' + newName + '" class="required" value="4" type="radio" id="' + newID + '-4">'+
        'Knee'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-5">'+
        '<input name="' + newName + '" class="required" value="5" type="radio" id="' + newID + '-5">'+
        'Thigh/Groin/Hip'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-6">'+
        '<input name="' + newName + '" class="required" value="6" type="radio" id="' + newID + '-6">'+
        'Pelvis/Abdomen/Low Back'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-7">'+
        '<input name="' + newName + '" class="required" value="7" type="radio" id="' + newID + '-7">'+
        'Ribs/Chest'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-8">'+
        '<input name="' + newName + '" class="required" value="8" type="radio" id="' + newID + '-8">'+
        'Neck/Upper Back'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-9">'+
        '<input name="' + newName + '" class="required" value="9" type="radio" id="' + newID + '-9">'+
        'Shoulder/Upper Arm'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-10">'+
        '<input name="' + newName + '" class="required" value="10" type="radio" id="' + newID + '-10">'+
        'Elbow/Forearm'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-11">'+
        '<input name="' + newName + '" class="required" value="11" type="radio" id="' + newID + '-11">'+
        'Wrist/Hand/Finger'+
        '</label>' +
        '</div>'+


        '<a class="next" href="#">Next</a>'+
        '<a class="prev" href="#">Previous</a>'+
        '</article>');

    var Part2NumQuestions = $('.part2').length;
    var numP2 = (currentPage - Part1NumQuestions) + (num+1);
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_' + newID + '"><a href="#">Question: '+numP2 + ' of '+Part2NumQuestions+ '</a></li>');


    //Add Injury Type question
    num++;
    newID = 'q' + num;
    newName = 'arr[' + num +']';
    newNameCustom = 'arr_1[' + num +']';
    $("article:last").closest("article").removeClass("visible").hide();
    $(".form-group").append('<article id="apage_' + num + '" class="part2 Question' + num + '">' +
        ' <label class=" control-label h4" for="' + newID + '">What type of Injury did you sustain? (pick one)</label> ' +
        '<br>' +
        '<div class="">' +
        '<fieldset><legend>Sudden Event (Acute - Traumatic)</legend>' +
        '<label class="radio" for="' + newID + '-1">'+
        '<input name="' + newName + '" class="required" value="1" type="radio" id="' + newID + '-1" onclick="checkvalue(this)">'+
        'Joint Sprain'+
        '</label>'+
        '<label class="radio" for="' + newID + '-2">'+
        '<input name="' + newName + '" class="required" value="2" type="radio" id="' + newID + '-2" onclick="checkvalue(this)">'+
        'Muscle Strain'+
        '</label>' +
        '<label class="radio" for="' + newID + '-3">'+
        '<input name="' + newName + '" class="required" value="3" type="radio" id="' + newID + '-3" onclick="checkvalue(this)">'+
        'Fracture'+
        '</label>' +
        '</fieldset>' +
        '<br>'+
        '<fieldset><legend>Gradual Onset (Chronic - Overuse)</legend>' +
        '<label class="radio" for="' + newID + '-4">'+
        '<input name="' + newName + '" class="required" value="4" type="radio" id="' + newID + '-4" onclick="checkvalue(this)">'+
        'Muscle/Tendon Disorder'+
        '</label>' +
        '<label class="radio" for="' + newID + '-5">'+
        '<input name="' + newName + '" class="required" value="5" type="radio" id="' + newID + '-5" onclick="checkvalue(this)">'+
        'Bone Stress Fracture'+
        '</label>' +
        '</fieldset>' +
        '<br><br>'+
        '<fieldset><legend>Other</legend>' +
        '<label class="radio" for="' + newID + '-6">'+
        '<input name="' + newName + '" class="required" value="6" type="radio" id="' + newID + '-6" onclick="checkvalue(this)">'+
        'Custom'+
        '</label>' +
        '<br>' +
        '<div class="other" style="display:none;">' +
        '<label class=" control-label h4" for="' + newNameCustom + '">Please Specify here:</label> ' +
        '<input id="' + newNameCustom +'" name="' + newNameCustom + '" class="element text medium other" maxlength="30" value="" type="text"> ' +
        '</div>' +
        '</fieldset>' +
        '</div>' +
        '<a class="next" href="#">Next</a>'+
        '<a class="prev" href="#">Previous</a>'+
        '</article>');

    var Part2NumQuestions = $('.part2').length;
    var numP2 = (currentPage - Part1NumQuestions) + (num+1);
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_' + newID + '"><a href="#">Question: '+numP2 + ' of '+Part2NumQuestions+ '</a></li>');


    //Add Time Loss question
    num++;
    newID = 'q' + num;
    newName = 'arr[' + num +']';
    $("article:last").closest("article").removeClass("visible").hide();
    $(".form-group").append('<article id="apage_' + num + '" class="part2 Question' + num + '">' +
        ' <label class=" control-label h4" for="' + newID + '">Was there any time lost as a result of this injury?</label> ' +
        '<div class="">' +
        '<label class="radio-inline" for="' + newID + '-2">'+
        '<input name="' + newName + '" class="required" value="1" type="radio" id="' + newID + '-2">'+
        'Yes - Complete activity restriction for at least one practice or game'+
        '</label>' +
        '<label class="radio-inline" for="' + newID + '-1">'+
        '<input name="' + newName + '" class="required" value="0" type="radio" id="' + newID + '-1">'+
        'No - Able to continue participating, despite reduced capabilities'+
        '</label>'+
        '</div>' +
        '<a class="next" href="#">Next</a>'+
        '<a class="prev" href="#">Previous</a>'+
        '</article>');

    var Part2NumQuestions = $('.part2').length;
    var numP2 = (currentPage - Part1NumQuestions) + (num+1);
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_' + newID + '"><a href="#">Question: '+numP2 + ' of '+Part2NumQuestions+ '</a></li>');


    //Add Other Injury question
    num++;
    newID = 'q' + num;
    newName = 'arr[' + num +']';
    $("article:last").closest("article").removeClass("visible").hide();
    $(".form-group").append('<article id="apage_' + num + '" class="part2 Question' + num + '" style="display: none;">' +
        ' <label class=" control-label h4" for="' + newID + '">Did you sustain any other musculoskeletal injuries '+versionText+' (same or different location)</label> ' +
        '<div class="">' +
        '<label class="radio-inline" for="' + newID + '-1">'+
        '<input name="' + newName + '" class="required" value="0" type="radio" id="' + newID + '-1" onclick="switchbtn(this)" >'+
        'No'+
        '</label>'+
        '<label class="radio-inline" for="' + newID + '-2">'+
        '<input name="' + newName + '" class="required" value="1" type="radio" id="' + newID + '-2" onclick="switchbtn(this)">'+
        'Yes'+
        '</label>' +
        '<input class="button_text submit" type="submit" name="submit" value="Submit" style="display:none;" />' +
        '</div>' +
        '<a class="next" href="#">Next</a>'+
        '<a class="prev" href="#">Previous</a>'+
        '</article>');

    var Part2NumQuestions = $('.part2').length;
    var numP2 = (currentPage - Part1NumQuestions) + (num+1);
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_' + newID + '"><a href="#">Question: '+numP2 + ' of '+Part2NumQuestions+ '</a></li>');

    newInjuryQuestion = num; //prepare for next Injury

    radioToButton();
}


$(window).keydown(function(event){
    if(event.keyCode == 13) {

        if(currentPage == Part1NumQuestions){
            //use default to submit form
        }
        else{
            event.preventDefault();
            $(".Question"+currentPage + " .next").click();
        }

        return false;
    }
});

//Adds btn class to radios if on mobile
function radioToButton() {
    var width = $(window).width();

    if (width <= 768) {
        $('.radio-inline').addClass('btn btn-default');
    }
    else {
        $('.radio-inline').removeClass('btn btn-default');
    }
}

$(document).ready(function() {

    if ($(window).innerWidth() <= 768){
        $('.radio-inline').addClass('btn btn-default');
    }
    $(window).resize(function () {
        var width = $(window).width();

        if (width <= 768) {
            $('.radio-inline').addClass('btn btn-default');
        }
        else {
            $('.radio-inline').removeClass('btn btn-default');
        }
    }).resize();


});

showCurrentTab();  //Show the first tab
radioToButton();
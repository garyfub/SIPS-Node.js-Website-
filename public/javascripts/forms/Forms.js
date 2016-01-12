// add next button to all questions and submit to last
$("article:not(:last)").append('<a class="next" href="#">Next</a>');
$("article:last").append('<input class="button_text submit" type="submit" name="submit" value="Submit User Info" />');
// add previous button to all questions except first
$("article:not(:first)").append('<a class="prev" href="#">Previous</a>');
//hide every form section except first
$("article:nth-child(1n+2)").hide();
//add class of visible to first question
$("article:first").addClass("visible");

//Make all questions required
$('form :input').not(':checkbox, :image, :button, :submit, :reset, :hidden, .notRequired').addClass('required');

var questionNum = 1;
var currentPage = 1;
var Part1NumQuestions = $('.part1').length;

//clear any saved info
$("#sport-other").val("");

//go through each section (article) and add a list item to the empty unorderd list with the page number
$(".part1").each(function () {
    $(".progress_counter").append('<li class ="questiontab" id="questiontab_' + questionNum + '"><a href="#">Question: ' + questionNum + ' of ' + Part1NumQuestions + '</a></li>');
    $(this).addClass("Question" + questionNum);
    questionNum++;
});
$('#page > li').hide();

$("form").validate({
    groups: {
        username: "fname lname",
        height: "ht_ft ht_in"
    },
    errorPlacement: function (error, element) {
        error.appendTo('article > div');
    },
    errorClass: "error-required",
    highlight: function (element, errorClass) {
        $(element).removeClass(errorClass);
    }
});

//each time the user clicks the next button, remove the visible class, hide that section, fade in the next question with a new class of visible
$(document).on("click", '.next', function (e) {
    e.preventDefault();

    if ($(".Question" + currentPage + ' :input').valid()) {
        $(".error-required").remove();
        $(this).closest("article").removeClass("visible").hide().next().addClass("visible").fadeIn();
        currentPage++;
        showCurrentTab();
    }
});

//each time the user clicks the next previous, remove the visible class, hide that section, fade in the prior question with a new class of visible
$(document).on("click", ".prev", function (e) {
    e.preventDefault();
    $(this).closest("article").removeClass("visible").hide().prev().addClass("visible").fadeIn();
    currentPage--;
    showCurrentTab();
});

function showCurrentTab() {
    $('.questiontab').hide();
    $('#questiontab_' + currentPage).show();
}

//Checks input of User Registration form when input is entered
function checkInput_URF(object) {
    switch (object.id) {
        case "fname":
            //console.log("First name is: " + object.value);
            // toast(object.value);
            break;

        case "lname":
            //console.log("Last name is: " + object.value);
            break;

        case "gender":
            break;

        case "age": //fall-through to ht-in
            if (object.value < 0 || object.value > 100)
                object.value = "";
            if (object.value.length > object.maxLength)
                object.value = object.value.slice(0, object.maxLength);
            break;

        case "weight":
            break;

        case "ht-ft":
            break;

        case "ht-in":
            break;
        case "sport-8":
            if ($('#sport-8').is(':checked')) {
                $("#sport-other").show();
            }
            else {
                $("#sport-other").hide();
                $("#sport-other").val("");
            }
            break;
        default:
            break;
    }
}

showCurrentTab();  //Show the first tab


//Creates toast message like on android.

var toast = function (msg) {
    $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>" + msg + "</h3></div>")
        .css({
            display: "block",
            opacity: 1.0,
            position: "fixed",
            padding: "5px",
            "text-align": "center",
            background: "rgba(79,79,79, 1)",
            color: 'white',
            "border-radius": "40px",
            width: "270px",
            left: ($(window).width() - 284) / 2,
            top: "80%"
        })
        .appendTo(".form_description").delay(1500)
        .fadeOut(300, function () {
            $(this).remove();
        });
}


$(window).keydown(function (event) {
    if (event.keyCode == 13) {

        if (currentPage == Part1NumQuestions) {
            //use default to submit form
        }
        else {
            event.preventDefault();
            $(".Question" + currentPage + " .next").click();
        }
        return false;
    }
});

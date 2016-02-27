/**
 * Script for views/partials/code_entry.ejs
 */
$( document ).ready(function() {
    $(".code_btn").click(function () {

        $(".code-panel").removeClass("panel-success panel-danger panel-warning").addClass("panel-primary");
        $("#code-msg").remove();

        if($("#code_insert").val() == ""){
            $('.code-panel').removeClass("panel-primary").addClass("panel-warning");
            $('.code-panel .panel-body').append('<p id="code-msg" class"text-warning">Please enter a valid code</p>');
        }
        else{
        $.ajax({
            url: '/code-submit',
            type: 'POST',
            data: $('#code_form').serialize(),
            success: function (data) {
                $('#code_form')[0].reset();
                $('.code-panel').removeClass("panel-primary").addClass("panel-success");
                $('.code-panel .panel-body').append('<p id=\'code-msg\' class"text-danger">Operation successful</p>');

            },
            error: function (data) {
                $('#code_form')[0].reset();
                $('.code-panel').removeClass("panel-primary").addClass("panel-danger");
                $('.code-panel .panel-body').append('<p id="code-msg" class"text-danger">Uh oh, must have been a bad code</p>');

            },
            complete: function () {
            }
        });
        }
    });
});

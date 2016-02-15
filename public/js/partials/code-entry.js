/**
 * Script for views/partials/code_entry.ejs
 */
$( document ).ready(function() {
    $(".code_btn").click(function () {

        $(".code-panel").removeClass("panel-success panel-danger").addClass("panel-default");
        $("#code-msg").remove();
        $.ajax({
            url: '/code-submit',
            type: 'POST',
            data: $('#code_form').serialize(),
            success: function (data) {
                $('#code_form')[0].reset();
                $('.code-panel').removeClass("panel-default").addClass("panel-success");
                $('.code-panel .panel-body').append('<p id=\'code-msg\' class"text-danger">Operation succesfull</p>');

            },
            error: function (data) {
                $('#code_form')[0].reset();
                $('.code-panel').removeClass("panel-default").addClass("panel-danger");
                $('.code-panel .panel-body').append('<p id="code-msg" class"text-danger">Uh oh, must have been a bad code</p>');

            },
            complete: function () {
            }
        });

    });
});

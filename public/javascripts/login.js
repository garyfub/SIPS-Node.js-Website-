
function signInCallback(authResult) {
    if (authResult.code) {
        $.post('/users/auth/google/callback', { id_token: authResult.id_token})
            .done(function(data) {
                $('#signinButton').hide();
            });
    } else if (authResult.error) {
        console.log('There was an error: ' + authResult.error);
    }
};


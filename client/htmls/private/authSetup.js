/**
 * Created by ankit.goel on 17/11/15.
 */
(function ($) {
    var Auth = {
        getToken: function () {
            var tokenDetail = window.localStorage.getItem('session.accessToken');
            tokenDetail = tokenDetail ==='null' ? null : tokenDetail;
            return tokenDetail;
        },
        removeToken: function () {
            window.localStorage.setItem('session.accessToken', null);
        },
        removeUser: function () {
            window.localStorage.setItem('session.user', null);
        },
        redirectToLogin: function () {
            window.location = "/cat3/"
        }
    };


    if (Auth.getToken()) {
        $.ajaxSetup({
            headers: {
                "x-catalyst-auth": Auth.getToken()
            }
        });
    } else {
        alert('Deny to access application');
    }
    window.doLogout = function () {
        return $.ajax({
            type: "get",
            url: "/auth/signout",
            success: function () {
                Auth.removeToken();
                Auth.removeUser();
                Auth.redirectToLogin();
            },
            error: function () {
                alert('server not able to do logout. Please refresh the page');

            }
        });
    };

})(window.jQuery);
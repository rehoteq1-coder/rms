(function(){
  var _orig = window.afterLogin;
  window.afterLogin = function(){
    if(_orig) _orig.apply(this, arguments);
    setTimeout(function(){
      var role = window.CURRENT && window.CURRENT.role;
      if(!role) return;
      // Hide all nav first
      ['nav-dashboard','nav-hod','nav-teacher','nav-admin','nav-modules',
       'nav-attendance','nav-results','nav-fees','nav-reports',
       'nav-timetable','nav-classteacher'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.style.display = 'none';
      });
      // Show correct nav per role
      var show = [];
      if(role === 'admin'){
        show = ['nav-dashboard','nav-hod','nav-teacher','nav-admin',
                'nav-fees','nav-reports','nav-timetable','nav-modules',
                'nav-attendance','nav-results'];
        var a = document.getElementById('dash-admin-btn');
        var h = document.getElementById('dash-hod-btn');
        if(a) a.style.display = 'block';
        if(h) h.style.display = 'block';
      } else if(role === 'hod'){
        show = ['nav-dashboard','nav-hod','nav-results',
                'nav-reports','nav-timetable','nav-attendance'];
        var h2 = document.getElementById('dash-hod-btn');
        if(h2) h2.style.display = 'block';
      } else if(role === 'teacher'){
        var staffRole = window.CURRENT && window.CURRENT.staffRole;
        if(staffRole === 'classTeacher'){
          show = ['nav-dashboard','nav-classteacher','nav-teacher','nav-attendance'];
        } else {
          show = ['nav-dashboard','nav-teacher'];
        }
      } else if(role === 'student'){
        var nav = document.getElementById('main-nav');
        if(nav) nav.style.display = 'none';
        return;
      }
      show.forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.style.display = '';
      });
    }, 300);
  };
})();

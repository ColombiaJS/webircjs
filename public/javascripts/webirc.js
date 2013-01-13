;(function ($, window, undefined) {
  'use strict';
  var currentTarget = null;
  var channels = {};
  var privates = {};
  var nickname = null;
  var isUser = false;

  $(document).ready(function() {
    $('#login').reveal();

    $('#authenticate').change(function() {
      if($(this).is(':checked')) {
        $('#services').show();
      } else {
        $('#services').hide();
      }
    });

    $('#connect').click(function(e) {
      e.preventDefault();

      $('#login').trigger('reveal:close');

      nickname = $('#nickname').val();

      var socket = io.connect();

      socket.emit('connect', nickname, '', '');

      socket.on('join', function(channel, nick, message) {
        if(nick === nickname) {
          channels[channel] = {};

          // Add tab
          createTab(channel);

          // Add window
          createWindow(channel);
        }
      });

      socket.on('topic', function(channel, topic, nick, message) {
        if(channels[channel]) {
          channels[channel].topic = topic;
        }
      });

      socket.on('names', function(channel, nicks) {
        if(channels[channel]) {
          channels[channel].nicks = nicks;
        }
      });

      socket.on('message', function(from, to, text, msg) {
        if(~to.indexOf('#') && channels[to]) {
          message(from, to, text);
        }
      });

      socket.on('pm', function(from, text, msg) {
          if(!privates[from]) {
            createTab(from);
            createWindow(from);
            privates[from] = { nick: from };
          }
          message(from, '#' + from , text);
      });

      socket.on('info', function(info) {
        $('#status').append('<pre>' + info + '</pre>');
        $("#status").get(0).scrollTop = 10000000;
      });

      $('#message-text').keydown(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code == 13) {
          var msg = $(this).val();
          var target = currentTarget;
          // Add message
          message(nickname, target, msg);

          if(isUser) {
            target = target.replace('#', '');
          }

          socket.emit('say', target, msg);
          $(this).val('');
        }
      });
    });

    activateTabs();

  });

  function createTab(target) {
    var tabSource = $('#tab-template').html();
    var tabTemplate = Handlebars.compile(tabSource);
    var tab = tabTemplate({ target: target });

    $('#tabs').append(tab);
    activateTabs();
  }

  function createWindow(target) {
    var winSource = $('#window-template').html();
    var winTemplate = Handlebars.compile(winSource);
    target = target.replace('#', '');
    var win = winTemplate({ target: target });

    $('#windows').append(win);
  }

  function message(from, to, msg) {
    var msgSource = $('#message-template').html();
    var msgTemplate = Handlebars.compile(msgSource);
    var msg = msgTemplate({ nickname: from, message: msg });

    $(to).append(msg);
    $(to).get(0).scrollTop = 10000000;
  }

  function activateTabs() {
    $('.tab').unbind('click');

    $('.tab').click(function(e) {
      e.preventDefault();

      $('.tab').addClass('secondary');
      $(this).removeClass('secondary');

      $('.window').hide();
      var target = $(this).data('target');

      if(~target.indexOf('#')) {
        $(target).show();

        var nicks = channels[target].nicks;

        $('#users').empty();
        for(var nick in nicks) {
          $('#users').append('<p>' + nicks[nick] + nick + '</p>');
        }
        currentTarget = target;
        isUser = false;
        $('#users').show();
      } else if(target == 'status') {
        $('#status').show();
        $('#users').hide();
        isUser = false;
      } else {
        $('#' + target).show();
        $('#users').hide();
        currentTarget = '#' + target;
        isUser = true;
      }

    });
  }

})(jQuery, this);
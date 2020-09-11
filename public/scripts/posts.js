(
  function() {
    var page, finished, running, lastSorted = 'feed'

    $('.sort-btn').on('click', function() {
      $('.sort-btn').removeClass('active')
      $(this).addClass('active')

      lastSorted = $(this).text().toLowerCase()
      finished = false
      $('#posts').html('')
      getPosts(1, lastSorted)
    })

    function load(loaded) {
      $('#loader').remove()
      if (!loaded) {
        $('#posts').append(
          `
          <div id='loader' class='col-md-12 text-center'>
            <br>
            <br>
            <img src="/images/loader.gif">
          </div>
          `
        )
      }
    }

    function gramCardHeader(post) {
      return `
      <div class="gram-card-header">
        <img class="gram-card-user-image lozad" src="${post.author.usertype == 'user' ? post.author.resume.basics.picture : post.author.logo}">
        <a class="gram-card-user-name" href="/users/${post.author.usertype}/@${post.author.username}">${post.author.username}</a>
        <div class="dropdown gram-card-time">
        ${post.author.username == username ? '<a style="margin-left: 10px" title="Delete" href="/post/delete/' + post._id +  '">🗑</a>' : ''}
        </div>
        <div class="time">${post.timeago}</div>
      </div>
      `
    }

    function gramCardImage(post) {
      if(post.staticUrl && ['png', 'jpg', 'gif', 'jpeg'].includes(post.type)) {
        return (`
        <div class="gram-card-image">
          <center>
            <a href="${post.staticUrl}" class="progressive replace">
              <img author="${post.author.username}" src="" id="${post._id}" class="post img-responsive lozad preview">
            </a> 
          </center>
        </div>
        `)
      } else if(post.staticUrl) {
        return (`
        <div class="gram-card-image">
          <center>
            <video author="${post.author.username}" src="${post.staticUrl}" id="${post._id}" class="post img-responsive" controls></video>
          </center>
        </div>
        `)
      } else {
        return ``
      }
    }

    function gramCardContent(post) {
      return `
      <div class="gram-card-content">
        <p>
          <a class="gram-card-content-user" href="/users/${post.author.usertype}/@${post.author.username}">${post.author.username}
          </a>
          ${post.caption}
          <span class="label label-info">${post.category ? post.category : "Unknown"}</span>
        </p>

        <p class="comments" id="comments-amount-${post._id}">${post.comments.length} comment(s).</p>
        <br>
        <hr>
        <br>
        <div class="comments-div" id="comments-${post._id}">
          ${post.comments.map(c => '<a class="user-comment" href="/users/' + c.by.usertype + '@' + c.by.username + '">@' + c.by.username + '</a> ' + c.text + '<br>' ).join('')}
        </div>
        <hr>
      </div>
      `
    }

    function gramCardFooter(post) {
      return `
      <div class="gram-card-footer">
        <button 
          class="footer-action-icons likes btn btn-link non-hoverable like-button-box" 
          data="${JSON.stringify(post.likes)}" 
          style="text-decoration: none; color: ${post.likes.find(x => x.username == $('#posts').attr('user-id')) ? 'grey' : '#f0b917'}"
          author="${post.author.username}"
          id="${post._id}-like"
        >
        👍${post.likes.length}
        </button>
        <input id="${post._id}" class="comments-input comment-input-box" author="${post.author.username}" type="text" id="comment" placeholder="Click enter to comment here..."/>
      </div>
      `
    }

    function getPosts(page = 1, sort = lastSorted) {
      if(running) {
        return;
      }
      load()

      if(finished) {
        return load(true)
      }

      var method = (page == 1) ? 'prepend' : 'append'

      running = true
      $.ajax(`/api/v1/posts?page=${page}&sort=${sort}`).done(function(posts) {
        running = false
        console.log(posts.length)
        posts.reverse()

        if(!posts.length && page == 1) {
          finished = true
          $('#posts').append(`
          <div class="alert alert-dismissible alert-success">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>Well done!</strong> You are all up to date!
          </div>
          `)
        } else if (!posts.length && page > 1) {
          load(true)
          return $(window).off('scroll')
        }

        posts.forEach((eachPost) => {
          $('#posts')[method](
            `<div class="gram-card">` +
            gramCardHeader(eachPost) + 
            '<br><br>' + 
            gramCardImage(eachPost) + 
            gramCardContent(eachPost) + 
            gramCardFooter(eachPost) + 
            `</div>`
          )
        })
        load(true)
        $(window).on('scroll', function() {
          if (finished) {
            return $(window).off(this)
          }

          if ($(document).height() - $(document).scrollTop() < 1369) {
            page++
            getPosts(page)
          }
        })
        $('.like-button-box').off('click')
        $('.like-button-box').on('click', likeById)

        function likeById() {
          console.log(this.id)
          const elem = this
          var author = $(`#${this.id}`).attr('author')  
          $.ajax({
            method: 'POST',
            url: `/api/v1/like?cache=${Math.random()}`,
            data: {
              _id: this.id.toString().split('-like')[0],
              author
            }
          }).done(function (data) {
            if (data.event) {
              $(elem).html(
                (data.msg === 'Liked' ? '👍' : '👎') +
                data.amount
              )
              show_notification(data.msg, 'success')
            } else {
              show_notification(data.msg, 'danger')
            }
          }).fail(function(error) {
            show_notification('Some error while liking the feed', 'danger')
            console.log(error)
          })
        }
        $('.comment-input-box').off('keydown')
        $('.comment-input-box').on('keydown', commentById)

        function commentById(key) {
          if (!this.value) {
            return
          } else if (key.keyCode == 13) {
              var el = this
              $.ajax({
                method: 'POST',
                url: '/api/v1/comment',
                data: {
                      _id: el.id,
                      author: $(el).attr('author'),
                      text: el.value
                  }
                })
                .done(function(data) {
                  $('#comments-' + el.id).append(`<a class="user-comment" href="/users/${data.by.usertype}/@${data.by.username}">
                  @${data.by.username}
                  </a> ${el.value}<br>`);
                  $('#comments-amount-' + el.id).html(data.amount + ' comments(s).')
                  el.value = ''
                  show_notification('Comment added!', 'success')
                })
                .fail(function(error) {
                  show_notification('Some error while posting the comment.', 'danger')
                  console.log(error)
                })
              }
          }
      })
    }
    getPosts()
  }
)()

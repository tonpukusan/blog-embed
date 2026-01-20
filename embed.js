(function() {
  var config = window.EMBED_CONFIG || {};
  var BLOG_URL = config.BLOG_URL || "";
  var FEED_PATH = config.FEED_PATH || "/feeds/posts/summary";
  var SUFFIX = config.SUFFIX || "";
  var CALLBACK_NAME = config.CALLBACK_NAME || "displayArticlesJSONP";
  var POST_HUB_BASE = "https://tonpukusan.github.io/index.html";

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message) {
    var toast = document.getElementById("ton3-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(function() {
      toast.style.opacity = "0";
    }, 2000);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(function() { showToast("コピーしました!"); })
      .catch(function(e) {
        console.error("Clipboard Error:", e);
        showToast("コピーに失敗しました");
      });
  }

  function copyTon3Embed(url) {
    var scriptOpen = "<" + "script src=\"https://ton3card.tonpukusan.workers.dev/ton3card.js\">" + "<" + "/script>";
    var divTag = "<div class=\"ton3-card\" data-url=\"" + url + "\"></div>";
    var code = scriptOpen + "\n" + divTag;
    copyToClipboard(code);
  }

  var nextUrl = BLOG_URL + FEED_PATH + "?alt=json&max-results=50&callback=" + CALLBACK_NAME;
  var isFetching = false;

  function fetchArticlesAuto() {
    if (isFetching || !nextUrl) return;
    isFetching = true;

    var script = document.createElement("script");
    script.src = nextUrl;
    script.onerror = function() { isFetching = false; };
    document.body.appendChild(script);
  }

  window[CALLBACK_NAME] = function(data) {
    isFetching = false;

    if (data.feed && data.feed.entry) {
      displayArticles(data);
    }

    var nextLink = null;
    if (data.feed && data.feed.link) {
      nextLink = data.feed.link.find(function(l) { return l.rel === "next"; });
    }

    if (nextLink) {
      var startIndex = nextLink.href.match(/start-index=(\d+)/);
      if (startIndex) {
        nextUrl = BLOG_URL + FEED_PATH +
          "?alt=json&max-results=50&start-index=" + startIndex[1] +
          "&callback=" + CALLBACK_NAME;
      } else {
        nextUrl = null;
      }
    } else {
      nextUrl = null;
    }

    if (nextUrl) fetchArticlesAuto();
  };

  function displayArticles(data) {
    var container = document.getElementById("toc-content");
    if (!container) return;

    var html = "";

    data.feed.entry.forEach(function(entry) {
      var title = entry.title.$t;
      var safeTitle = escapeHTML(title);

      var hrefObj = entry.link.find(function(l) { return l.rel === "alternate"; });
      var href = hrefObj ? hrefObj.href : "";
      var postdate = entry.published.$t.substring(0, 10);

      var img_src = (entry.media$thumbnail && entry.media$thumbnail.url) ||
        "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHhH_s0EKdgNEbOuz4OIQEEWhdgqbpCBk1tLZjXQrnkFsxaP2F1_P9emqbnprxxBWk-A8rJ_cLfmI1NJrW6FAPYNtkhcegw81vhnsV79e2Sa0vqOe2bwGfjbL-K5EwnE0CWV0iq6N998I/s96/ProfilePhoto.jpg";

      img_src = img_src.replace(/s\d+-c/, "s120");

      var xShareUrl =
        "https://twitter.com/intent/tweet?url=" +
        encodeURIComponent(href) +
        "&text=" +
        encodeURIComponent(title + SUFFIX);

      var postHubUrl =
        POST_HUB_BASE +
        "?text=" + encodeURIComponent(title) +
        "&url=" + encodeURIComponent(href);

      html +=
        '<div class="article-block">' +
          '<div class="article-header" id="div_' + postdate + '">' +
            '<img src="' + img_src + '" width="40" height="40" />' +
            '<a href="' + href + '" target="_blank">' + safeTitle + '</a>' +
          '</div>' +
          '<div class="article-url">' + href + '</div>' +
          '<div class="toc-buttons">' +
            '<div class="copy-article-btn" data-copy-html="div_' + postdate + '">コピー</div>' +
            '<div class="copy-url-btn" data-url="' + href + '">URLをコピー</div>' +
            '<div class="x-share-btn">' +
              '<a href="' + xShareUrl + '" target="_blank">Xでシェア</a>' +
            '</div>' +
            '<div class="posthub-btn" data-posthub="' + postHubUrl + '" style="display:none;">' +
              '<a href="' + postHubUrl + '" target="_blank">投稿ハブで開く</a>' +
            '</div>' +
            '<div class="blog-embed-btn" data-url="' + href + '">記事を埋め込む</div>' +
          '</div>' +
        '</div>';
    });

    container.insertAdjacentHTML("beforeend", html);

    bindEvents();
    restoreLoginState();
  }

  function bindEvents() {
    document.querySelectorAll(".copy-article-btn").forEach(function(btn) {
      btn.onclick = function() {
        var id = btn.getAttribute("data-copy-html");
        var el = document.getElementById(id);
        if (!el) return;

        var html = el.outerHTML;

        if (navigator.clipboard && window.ClipboardItem) {
          navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" })
            })
          ])
          .then(function() {
            showToast("記事タイトルと画像をコピーしました");
          })
          .catch(function(error) {
            console.error(error);
            showToast("コピーに失敗しました");
          });
        } else {
          navigator.clipboard.writeText(html)
          .then(function() {
            showToast("記事タイトルと画像をコピーしました");
          })
          .catch(function(error) {
            console.error(error);
            showToast("コピーに失敗しました");
          });
        }
      };
    });

    document.querySelectorAll(".copy-url-btn").forEach(function(btn) {
      btn.onclick = function() {
        var url = btn.getAttribute("data-url");
        copyToClipboard(url);
      };
    });

    document.querySelectorAll(".blog-embed-btn").forEach(function(btn) {
      btn.onclick = function() {
        var url = btn.getAttribute("data-url");
        copyTon3Embed(url);
      };
    });
  }

  function restoreLoginState() {
    if (localStorage.getItem("isLoggedIn") === "true") {
      document.querySelectorAll(".posthub-btn").forEach(function(el) {
        el.style.display = "inline-block";
      });
    }
  }

  // ✅ DOMが完全に構築されてから開始
  window.onload = fetchArticlesAuto;
})();

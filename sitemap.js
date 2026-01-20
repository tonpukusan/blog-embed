(function () {
  const config = window.SITEMAP_CONFIG || {};
  const BLOG_URL = config.BLOG_URL;
  const FEED_PATH = config.FEED_PATH || "/feeds/posts/default";
  const CALLBACK_NAME = config.CALLBACK_NAME || "loadSitemap";

  // Blogger 側の ID 差異を吸収
  const container =
    document.getElementById("bp_toc") ||
    document.getElementById("bp_toc_o");

  if (!container) return;

  let postTitle = [];
  let postUrl = [];
  let postDate = [];
  let postSum = [];
  let postLabels = [];
  let postThumbnail = [];

  let sortBy = "datenewest";
  let postFilter = "";
  let totalEntries = 0;
  let totalPosts = 0;
  let tocLoaded = false;

  // JSONP コールバックを window に登録
  window[CALLBACK_NAME] = function (json) {
    if (!json.feed || !json.feed.entry) return;

    const entries = json.feed.entry;
    totalEntries += entries.length;
    totalPosts = json.feed.openSearch$totalResults.$t;

    entries.forEach(entry => {
      const title = entry.title.$t;
      const date = entry.published.$t.substring(0, 10);
      const url = entry.link.find(l => l.rel === "alternate").href;

      let img = entry.media$thumbnail
        ? entry.media$thumbnail.url
        : "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHhH_s0EKdgNEbOuz4OIQEEWhdgqbpCBk1tLZjXQrnkFsxaP2F1_P9emqbnprxxBWk-A8rJ_cLfmI1NJrW6FAPYNtkhcegw81vhnsV79e2Sa0vqOe2bwGfjbL-K5EwnE0CWV0iq6N998I/s96/ProfilePhoto.jpg";

      let content = entry.content
        ? entry.content.$t
        : entry.summary
        ? entry.summary.$t
        : "";
      content = content.replace(/<\S[^>]*>/g, "").substring(0, 250) + "...";

      let labels = "";
      if (entry.category) {
        labels = entry.category
          .map(cat => `<a href="javascript:filterPosts('${cat.term}');"> ${cat.term} </a>`)
          .join(", ");
      }

      postTitle.push(title);
      postDate.push(date);
      postUrl.push(url);
      postSum.push(content);
      postLabels.push(labels);
      postThumbnail.push(img);
    });

    // 次ページがある場合は再帰 JSONP
    if (totalEntries < totalPosts) {
      const nextIndex = totalEntries + 1;
      const script = document.createElement("script");
      script.src =
        `${BLOG_URL}${FEED_PATH}?start-index=${nextIndex}` +
        `&max-results=500&alt=json-in-script&callback=${CALLBACK_NAME}`;
      document.body.appendChild(script);
    } else {
      tocLoaded = true;
      setTimeout(() => displayToc(postFilter), 50);
    }

    sortPosts(sortBy);
  };

  // ソート
  function sortPosts(type) {
    const swap = (i, j) => {
      [postTitle[i], postTitle[j]] = [postTitle[j], postTitle[i]];
      [postDate[i], postDate[j]] = [postDate[j], postDate[i]];
      [postUrl[i], postUrl[j]] = [postUrl[j], postUrl[i]];
      [postSum[i], postSum[j]] = [postSum[j], postSum[i]];
      [postLabels[i], postLabels[j]] = [postLabels[j], postLabels[i]];
      [postThumbnail[i], postThumbnail[j]] = [postThumbnail[j], postThumbnail[i]];
    };

    for (let i = 0; i < postTitle.length - 1; i++) {
      for (let j = i + 1; j < postTitle.length; j++) {
        if (type === "titleasc" && postTitle[i] > postTitle[j]) swap(i, j);
        if (type === "titledesc" && postTitle[i] < postTitle[j]) swap(i, j);
        if (type === "dateoldest" && postDate[i] > postDate[j]) swap(i, j);
        if (type === "datenewest" && postDate[i] < postDate[j]) swap(i, j);
      }
    }
  }

  // 表示
  window.filterPosts = function (filter) {
    postFilter = filter;
    displayToc(filter);
  };

  window.allPosts = function () {
    postFilter = "";
    displayToc("");
  };

  window.toggleTitleSort = function () {
    sortBy = sortBy === "titleasc" ? "titledesc" : "titleasc";
    sortPosts(sortBy);
    displayToc(postFilter);
  };

  window.toggleDateSort = function () {
    sortBy = sortBy === "datenewest" ? "dateoldest" : "datenewest";
    sortPosts(sortBy);
    displayToc(postFilter);
  };

  function displayToc(filter) {
    let html = "";
    let count = 0;

    html += `<table>
      <tr>
        <td class="toc-header-col1"><a href="javascript:toggleTitleSort();">記事タイトル</a></td>
        <td class="toc-header-col2"><a href="javascript:toggleDateSort();">投稿</a></td>
        <td class="toc-header-col3"><a href="javascript:allPosts();">ラベル</a></td>
      </tr>`;

    for (let i = 0; i < postTitle.length; i++) {
      if (filter === "" || postLabels[i].includes(filter)) {
        html += `
          <tr>
            <td class="toc-entry-col1">
              <img src="${postThumbnail[i]}"/>
              <a href="${postUrl[i]}" target="_blank" rel="noopener" title="${postSum[i]}">${postTitle[i]}</a>
            </td>
            <td class="toc-entry-col2">${postDate[i]}</td>
            <td class="toc-entry-col3">${postLabels[i]}</td>
          </tr>`;
        count++;
      }
    }

    html += `</table>`;

    const note =
      filter === ""
        ? `<span class="toc-note">全 ${postTitle.length} 件の記事を表示中<br/></span>`
        : `<span class="toc-note">全 ${postTitle.length} 件中 ラベル「<b>${filter}</b>」の ${count} 件を表示中<br/></span>`;

    container.innerHTML = note + html;
  }

  // 初回 JSONP 呼び出し
  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}${FEED_PATH}?alt=json-in-script&max-results=500&callback=${CALLBACK_NAME}`;
  document.body.appendChild(script);
})();

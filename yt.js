(function () {
  // ------------------------------------------------
  //  CONFIG – REPLACE WITH YOUR OWN KEY IF NEEDED
  // ------------------------------------------------
  const API_KEY = "AIzaSyCDzNdqidGRxlo8wWuUfrvlzxcK19NzeEw";
  const CHANNEL_ID = "UCV8SXUH5hEjEW0hEPJMlAiw";

  // DOM elements
  const subsEl = document.getElementById("subs");
  const viewsEl = document.getElementById("views");
  const videosEl = document.getElementById("videos");
  const last10viewsEl = document.getElementById("dailyViews"); // repurposed: last 10 total views
  const last10likesEl = document.getElementById("hourlyViews"); // repurposed: last 10 total likes
  const latestViewsEl = document.getElementById("totalLikes"); // repurposed: latest video views
  const recentContainer = document.getElementById("recentVideosContainer");
  const chartCanvas = document.getElementById("growthChart");

  let viewsChart = null; // Chart.js instance
  let channelTotalViews = 0; // fallback

  // ---------- helper: animate number ----------
  function animate(elem, target) {
    if (!elem) return;
    const t = parseInt(target, 10);
    if (isNaN(t)) return;
    let current = parseInt(elem.innerText.replace(/,/g, "")) || 0;
    if (current === t) return;
    const steps = 30;
    const inc = (t - current) / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current += inc;
      if (step >= steps) {
        current = t;
        clearInterval(interval);
      }
      elem.innerText = Math.floor(current).toLocaleString();
    }, 20);
  }

  // ---------- build chart from last 7 video items ----------
  function buildChartFromVideos(videoItems) {
    if (!videoItems || videoItems.length === 0) {
      if (viewsChart) {
        viewsChart.destroy();
        viewsChart = null;
      }
      return;
    }

    // take at most 7 most recent (already sorted desc)
    const recent7 = videoItems.slice(0, 7).reverse(); // reverse to show oldest → newest on x-axis
    const labels = recent7.map((v) => {
      const d = new Date(v.snippet.publishedAt);
      return d.toLocaleDateString("en", { month: "short", day: "numeric" });
    });
    const viewCounts = recent7.map((v) =>
      parseInt(v.statistics?.viewCount || 0),
    );

    if (viewsChart) {
      viewsChart.data.labels = labels;
      viewsChart.data.datasets[0].data = viewCounts;
      viewsChart.update();
    } else {
      viewsChart = new Chart(chartCanvas, {
        type: "bar", // bar makes it clear these are actual video views
        data: {
          labels: labels,
          datasets: [
            {
              label: "views per video",
              data: viewCounts,
              backgroundColor: "rgba(96, 176, 255, 0.7)",
              borderColor: "#60b0ff",
              borderWidth: 1,
              borderRadius: 8,
              barPercentage: 0.65,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterTitle: (ctx) => {
                  const video = recent7[ctx[0].dataIndex];
                  return video ? video.snippet.title : "";
                },
              },
            },
          },
          scales: {
            y: {
              grid: { color: "#253b5a" },
              ticks: { color: "#b0c9f0" },
              beginAtZero: true,
            },
            x: {
              grid: { display: false },
              ticks: { color: "#b0c9f0", maxRotation: 20 },
            },
          },
        },
      });
    }
  }

  // ---------- fetch channel + last 10 videos ----------
  async function loadChannelAndVideos() {
    try {
      // 1) get channel statistics
      const chanUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
      const chanRes = await fetch(chanUrl);
      const chanData = await chanRes.json();
      if (!chanData.items?.length) throw new Error("channel not found");

      const stats = chanData.items[0].statistics;
      const subs = stats.subscriberCount || 0;
      const views = stats.viewCount || 0;
      const vids = stats.videoCount || 0;
      channelTotalViews = parseInt(views, 10);

      animate(subsEl, subs);
      animate(viewsEl, views);
      animate(videosEl, vids);

      const uploadsId =
        chanData.items[0].contentDetails.relatedPlaylists.uploads;

      // 2) fetch last 10 videos (real data)
      await fetchRecentVideos(uploadsId);
    } catch (e) {
      console.warn("API error, using fallback numbers", e);
      // fallback (just to keep UI alive)
      animate(subsEl, 1240000);
      animate(viewsEl, 389000000);
      animate(videosEl, 342);
      channelTotalViews = 389000000;

      // show error in video container
      recentContainer.innerHTML = `<div class="error-msg">⚠️ API error — using fallback stats. Check key or channel ID.</div>`;
    }
  }

  // ---------- fetch last 10 playlist items + video details ----------
  async function fetchRecentVideos(playlistId) {
    try {
      // get last 10 playlistItems
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${playlistId}&key=${API_KEY}`;
      const plRes = await fetch(playlistUrl);
      const plData = await plRes.json();
      if (!plData.items?.length) throw new Error("no videos in playlist");

      const videoIds = plData.items
        .map((item) => item.snippet.resourceId.videoId)
        .join(",");

      // fetch video statistics (likes, views) and snippet (for titles/dates)
      const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`;
      const vidRes = await fetch(vidUrl);
      const vidData = await vidRes.json();

      let videoItems = vidData.items || [];
      // sort by publishedAt descending (latest first)
      videoItems.sort(
        (a, b) =>
          new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt),
      );

      // ----- AGGREGATE REAL METRICS -----
      let totalViewsLast10 = 0;
      let totalLikesLast10 = 0;
      videoItems.forEach((v) => {
        const views = parseInt(v.statistics?.viewCount || 0);
        const likes = parseInt(v.statistics?.likeCount || 0);
        totalViewsLast10 += views;
        totalLikesLast10 += likes;
      });

      // latest video (first after sorting) views
      const latestViews =
        videoItems.length > 0
          ? parseInt(videoItems[0].statistics?.viewCount || 0)
          : 0;

      // update stat cards (all real now)
      animate(last10viewsEl, totalViewsLast10);
      animate(last10likesEl, totalLikesLast10);
      animate(latestViewsEl, latestViews);

      // build chart from last 7 videos
      buildChartFromVideos(videoItems);

      // ----- RENDER VIDEO CARDS (last 10) -----
      let cardsHtml = "";
      videoItems.forEach((v) => {
        const title = v.snippet.title || "Untitled";
        const thumb =
          v.snippet.thumbnails?.medium?.url ||
          v.snippet.thumbnails?.default?.url ||
          "";
        const published = new Date(v.snippet.publishedAt).toLocaleDateString();
        const viewCount = v.statistics?.viewCount
          ? parseInt(v.statistics.viewCount).toLocaleString()
          : "N/A";
        const likeCount = v.statistics?.likeCount
          ? parseInt(v.statistics.likeCount).toLocaleString()
          : "0";
        const videoUrl = `https://www.youtube.com/watch?v=${v.id}`;

        cardsHtml += `
                            <div class="video-card">
                                <img class="video-thumb" src="${thumb}" alt="thumbnail" loading="lazy" onerror="this.src='https://via.placeholder.com/320x180?text=no+thumb'">
                                <div class="video-title">${title}</div>
                                <div class="video-meta">
                                    <span>👁️ ${viewCount}</span>
                                    <span>❤️ ${likeCount}</span>
                                    <span>📅 ${published}</span>
                                </div>
                                <a href="${videoUrl}" target="_blank" class="watch-btn">▶ Watch video</a>
                            </div>
                        `;
      });

      recentContainer.innerHTML =
        cardsHtml || '<div class="error-msg">No videos found</div>';
    } catch (e) {
      console.warn("video fetch error", e);
      recentContainer.innerHTML = `<div class="error-msg">Failed to load videos. ${e.message}</div>`;
    }
  }

  // initial load and refresh every 60 seconds (real-time update)
  loadChannelAndVideos();
  setInterval(loadChannelAndVideos, 60000); // 60s respects quota, feels "live"
})();

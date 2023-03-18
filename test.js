// ==UserScript==
// @name         B站视频下载工具联动脚本[音频mp3🎵，视频mp4📹，弹幕xml，ass🌴，封面🌾]
// @namespace    http://tampermonkey.net/
// @version      0.1.8
// @description  脚本负责获取音频，工具负责视频封面弹幕等等，相互联动，互相增强，好耶ヽ(✿ﾟ▽ﾟ)ノ
// @author       王子周棋洛
// @match        https://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    let audioState = false;
    let index = 0;
    let my_xhr = null;

    /**
     * 单例添加css style在head中
     * @param {*} css 样式字符串
     * @param {*} name 样式类名
     */
    function renderCSS(css, name) {
        if (!document.head.querySelector(`.${name}`)) {
            let style = document.createElement("style");
            style.className = name;
            style.innerHTML = css;
            document.head.appendChild(style);
        }
    }

    function renderAlert($el) {
        let my_bili_system = document.createElement("div");
        let my_bili_system_header = document.createElement("div");
        let my_bili_system_close = document.createElement("div");
        let my_bili_system_content = document.createElement("div");
        let my_bili_system_join_time = document.createElement("div");
        let h1 = document.createElement("h1");
        let a1 = document.createElement("a");
        let a2 = document.createElement("a");
        let span1 = document.createElement("span");
        let span2 = document.createElement("span");
        let span3 = document.createElement("span");
        let my_bili_system_btns = document.createElement("div");
        my_bili_system.className = "my_bili_system";
        my_bili_system_header.className = "my_bili_system_header";
        my_bili_system_close.className = "my_bili_system_close";
        my_bili_system_content.className = "my_bili_system_content";
        my_bili_system_btns.className = "my_bili_system_btns";
        my_bili_system_join_time.className = "my_bili_system_join_time";
        for (let i = 0; i < 5; i++) {
            let div = document.createElement("div");
            div.className = "my_bili_system_btn";
            let p = document.createElement("p");
            let label = document.createElement("label");
            let input = document.createElement("input");
            input.type = "checkbox";
            let span = document.createElement("span");
            span.classList = "checkbox";
            label.appendChild(input);
            label.appendChild(span);
            if (i == 0) p.innerHTML = "封面";
            if (i == 1) p.innerHTML = "下载音频";
            if (i == 2) p.innerHTML = "下载视频";
            if (i == 3) p.innerHTML = "关闭投票";
            if (i == 4) p.innerHTML = "关闭三联";
            div.appendChild(p);
            div.appendChild(label);
            my_bili_system_content.appendChild(div);
        }
        a1.innerHTML = "重置脚本";
        a2.innerHTML = "关注作者";
        span1.innerHTML = "入站时间: ";
        span3.innerHTML = "有其他需求可加入群聊讲";
        my_bili_system_close.innerHTML = "X";
        h1.innerHTML = "B站视频下载工具辅助脚本";
        a2.href = "https://space.bilibili.com/1608325226";
        my_bili_system_join_time.appendChild(span1);
        my_bili_system_join_time.appendChild(span2);
        my_bili_system_btns.appendChild(a1);
        my_bili_system_btns.appendChild(a2);
        my_bili_system_btns.appendChild(span3);
        my_bili_system_header.appendChild(my_bili_system_close);
        my_bili_system_header.appendChild(h1);

        my_bili_system.appendChild(my_bili_system_header);
        my_bili_system.appendChild(my_bili_system_join_time);
        my_bili_system.appendChild(my_bili_system_content);
        my_bili_system.appendChild(my_bili_system_btns);
        // 挂载
        $el.appendChild(my_bili_system);
    }

    /**
     * 隐藏投票
     */
    function hideVote() {
        renderCSS(`.bili-vote{display:none !important};`, "my_bili_hide_vote");
    }

    /**
     * 移除元素
     * @param {*} p 移除元素的父容器，dom
     * @param {*} e 移除的元素，字符串
     */
    function removeDom(p, e) {
        if (p.querySelector(`.${e}`)) {
            p.querySelectorAll(`.${e}`).forEach(i => {
                p.removeChild(i);
            })
        }
    }
    // 时间戳格式化为标准时间
    function formatTimestamp(timestamp) {
        var date = new Date(timestamp);
        var year = date.getFullYear();
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        var hours = ("0" + date.getHours()).slice(-2);
        var minutes = ("0" + date.getMinutes()).slice(-2);
        var seconds = ("0" + date.getSeconds()).slice(-2);
        return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    }

    /**
     * 隐藏三联
     */
    function hideThree() {
        renderCSS(`.bili-guide{display:none !important};`, "my_bili_hide_three");
    }

    // 获取信息，主要用于查看入站时间
    function getLoginUserData() {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('GET', 'https://member.bilibili.com/x2/creative/h5/calendar/event?ts=0', true);
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let jsonData = JSON.parse(xhr.responseText)
                    let time = formatTimestamp(jsonData.data.pfs.profile.jointime * 1000);
                    document.querySelector(".my_bili_system_join_time").querySelectorAll("span")[1].innerHTML = time;
                } else {
                    document.querySelector(".my_bili_system_join_time").style.display = "none";
                }
            }
        };
        xhr.send(null);
    }

    let renderButton = () => {
        if (!document.querySelector(".my_bili_system_button")) {
            let myBiliSystemButton = createNode('a', '设置', 'my_bili_system_button');
            if (!document.querySelector(".my_bili_system")) {
                renderAlert(document.body);
                renderCSS(`.my_bili_system .my_bili_system_content .my_bili_system_btn label{display:block;width:15px;height:15px;cursor:pointer;display:flex;justify-content:flex-end}.my_bili_system .my_bili_system_content .my_bili_system_btn input[type='checkbox']{position:absolute;transform:scale(0)}.my_bili_system .my_bili_system_content .my_bili_system_btn input[type='checkbox']:checked~.checkbox{transform:rotate(45deg);width:14px;margin-left:5px;border-color:#24c78e;border-width:5px;border-top-color:transparent;border-left-color:transparent;border-radius:0;box-sizing:border-box}.my_bili_system .my_bili_system_content .my_bili_system_btn .checkbox{display:block;width:inherit;height:inherit;border:solid 2px #919191b7;border-radius:5px;transition:all .375s}.my_bili_system{font-family:SF Pro SC,SF Pro Text,SF Pro Icons,PingFang SC,Helvetica Neue,Helvetica,Arial,sans-serif;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:400px;max-height:300px;border:1px solid #ddd;box-shadow:0 2px 3px #ccc;border-radius:4px;transition:height .3s;overflow:auto;padding:5px 10px;background-color:#fafafa;display:none;z-index:9999999999999}.my_bili_system::-webkit-scrollbar{width:5px}.my_bili_system::-webkit-scrollbar-track{background-color:#d8d8d8;border-radius:100px}.my_bili_system::-webkit-scrollbar-thumb{background-color:#6eb79d;border-radius:100px}.my_bili_system .my_bili_system_header .my_bili_system_close:hover{background-color:#d0d2d5;color:#888}.my_bili_system .my_bili_system_header .my_bili_system_close{position:absolute;right:0;top:0;color:#ccc;cursor:pointer;padding:4px 10px;border-radius:0 4px 0 0;display:flex;align-items:center;justify-content:center;transition:background-color .15s,color .2s}.my_bili_system .my_bili_system_header h1{font-size:15px;color:#333;margin:0}.my_bili_system .my_bili_system_content .my_bili_system_btn{display:flex;align-items:center;width:100%;border-bottom:1px solid #eee;padding:5px 0}.my_bili_system .my_bili_system_content .my_bili_system_btn label{flex:1}.my_bili_system .my_bili_system_content .my_bili_system_btn p{font-size:13px;color:#686868;font-weight:600;margin:5px 0}.my_bili_system_btns{padding:5px 0}.my_bili_system_btns a{text-decoration:none;color:#fff;background-color:#fb819f;font-size:12px;padding:2px 4px;border-radius:4px;margin-right:5px}.my_bili_system_btns span{color:#767b7f;font-size:12px}.my_bili_system_join_time{font-size:12px;color:#fb819f;padding-top:5px}.my_bili_system_join_time span:nth-of-type(1){color:#24c78e}`, "my_bili_system_css");
            }
            myBiliSystemButton.addEventListener('click', e => {
                e.preventDefault();
                getLoginUserData();
                document.querySelector(".my_bili_system").style.display = "block";
                let systems = document.querySelectorAll(".my_bili_system input");
                let biliSystem = document.querySelector(".my_bili_system")
                let closeBtn = document.querySelector(".my_bili_system_close");
                let btns = document.querySelector(".my_bili_system_btns").querySelectorAll("a");
                if (localStorage.getItem("myBiliCoverImg") && localStorage.getItem("myBiliCoverImg") == 'true') systems[0].checked = true;
                if (localStorage.getItem("myBiliMP3") && localStorage.getItem("myBiliMP3") == 'true') systems[1].checked = true;
                if (localStorage.getItem("myBiliMP4") && localStorage.getItem("myBiliMP4") == 'true') systems[2].checked = true;
                if (localStorage.getItem("myBiliCloseTou") && localStorage.getItem("myBiliCloseTou") == 'true') systems[3].checked = true;
                if (localStorage.getItem("myBiliCloseThree") && localStorage.getItem("myBiliCloseThree") == 'true') systems[4].checked = true;
                systems[0].addEventListener('change', e => {
                    if (e.target.checked == true) {
                        localStorage.setItem("myBiliCoverImg", true);
                    } else {
                        localStorage.setItem("myBiliCoverImg", false);
                    }
                })
                systems[1].addEventListener('change', e => {
                    if (e.target.checked == true) {
                        localStorage.setItem("myBiliMP3", true);
                    } else {
                        localStorage.setItem("myBiliMP3", false);
                    }
                })
                systems[2].addEventListener('change', e => {
                    if (e.target.checked == true) {
                        localStorage.setItem("myBiliMP4", true);
                    } else {
                        localStorage.setItem("myBiliMP4", false);
                    }
                })
                systems[3].addEventListener('change', e => {
                    if (e.target.checked == true) {
                        localStorage.setItem("myBiliCloseTou", true);
                    } else {
                        localStorage.setItem("myBiliCloseTou", false);
                    }
                })
                systems[4].addEventListener('change', e => {
                    if (e.target.checked == true) {
                        localStorage.setItem("myBiliCloseThree", true);
                    } else {
                        localStorage.setItem("myBiliCloseThree", false);
                    }
                })
                closeBtn.addEventListener('click', e => {
                    setTimeout(() => {
                        biliSystem.style.display = 'none';
                    }, 120);
                })
                btns[0].addEventListener("click", e => {
                    e.preventDefault();
                    systems.forEach(s => {
                        s.checked = false;
                    })
                    if (localStorage.getItem("myBiliCoverImg")) localStorage.removeItem("myBiliCoverImg");
                    if (localStorage.getItem("myBiliMP3")) localStorage.removeItem("myBiliMP3");
                    if (localStorage.getItem("myBiliMP4")) localStorage.removeItem("myBiliMP4");
                    if (localStorage.getItem("myBiliCloseTou")) localStorage.removeItem("myBiliCloseTou");
                    if (localStorage.getItem("myBiliCloseThree")) localStorage.removeItem("myBiliCloseThree");
                })
            })
        }

        // 如果设置开启了就注入css，否则移除css
        localStorage.getItem("myBiliCloseTou") && localStorage.getItem("myBiliCloseTou") == 'true' ? hideVote() : removeDom(document.head, "my_bili_hide_vote");
        localStorage.getItem("myBiliCloseThree") && localStorage.getItem("myBiliCloseThree") == 'true' ? hideThree() : removeDom(document.head, "my_bili_hide_three");

        // 根据设置和具体要求，选择性渲染按钮，设置是必渲染项
        if (localStorage.getItem("myBiliCoverImg") && localStorage.getItem("myBiliCoverImg") == "true") {
            if (__INITIAL_STATE__.videoData.pic && !document.querySelector(".my_coverImg_button")) {
                let coverImgButton = createNode('a', '封面', 'my_coverImg_button');
                coverImgButton.href = __INITIAL_STATE__.videoData.pic;
                coverImgButton.target = '_blank';
            }
        } else {
            removeDom(chooseEl(), "my_coverImg_button");
        }
        let items = document.querySelectorAll('.clickitem');
        let heji = document.querySelectorAll(".video-episode-card");
        if (items.length != 0) {
            items.forEach((item, i) => {
                item.addEventListener('click', e => {
                    if (my_xhr != null) my_xhr.abort();
                    index = i;
                    if (document.querySelector(".my_audio_button")) document.querySelector(".my_audio_button").remove();
                    if (document.querySelector(".my_coverImg_button")) document.querySelector(".my_coverImg_button").remove();
                    if (document.querySelector(".my_video_button")) document.querySelector(".my_video_button").remove();
                })
            })
        }
        if (heji.length != 0) {
            heji.forEach((item, i) => {
                item.addEventListener('click', e => {
                    if (my_xhr != null) my_xhr.abort();
                    if (document.querySelector(".my_audio_button")) document.querySelector(".my_audio_button").remove();
                    if (document.querySelector(".my_coverImg_button")) document.querySelector(".my_coverImg_button").remove();
                    if (document.querySelector(".my_video_button")) document.querySelector(".my_video_button").remove();
                })
            })
        }
        if (localStorage.getItem("myBiliMP3") && localStorage.getItem("myBiliMP3") == 'true') {
            if (__INITIAL_STATE__.aid && __INITIAL_STATE__.bvid && __INITIAL_STATE__.videoData.pages[0].cid && !document.querySelector(".my_audio_button")) {
                let audioButton = createNode('a', '下载MP3', 'my_audio_button');
                audioButton.addEventListener('click', e => {
                    if (!audioState) {
                        audioState = true;
                        let url = `https://api.bilibili.com/x/player/playurl?avid=${__INITIAL_STATE__.aid}&bvid=${__INITIAL_STATE__.bvid}&cid=${__INITIAL_STATE__.videoData.pages[index].cid}&fnval=4048`;
                        fetch(url, {
                            method: "GET",
                            responseType: "application/json"
                        }).then(resp => {
                            return resp.json();
                        }).then(i => {
                            my_xhr = new XMLHttpRequest();
                            my_xhr.responseType = 'blob';
                            my_xhr.open('GET', i.data.dash.audio[0].base_url, true);
                            my_xhr.addEventListener('progress', function (event) {
                                audioButton.textContent = `下载中... ${parseInt((event.loaded / event.total) * 100)}%`;
                            }, false);
                            my_xhr.onload = () => {
                                if (my_xhr.status === 200) {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(my_xhr.response);
                                    reader.onload = function (e) {
                                        const a = document.createElement('a');
                                        if (document.querySelector(".video-title")) {
                                            a.download = document.querySelector(".video-title").textContent + ".mp3";
                                        } else {
                                            a.download = `Hello Wolrd.mp3`
                                        }
                                        a.href = e.target.result;
                                        document.documentElement.appendChild(a);
                                        a.click();
                                        a.remove();
                                        audioState = false;
                                        my_xhr = null;
                                        audioButton.textContent = `下载MP3`;
                                    };
                                }
                            }
                            my_xhr.send();
                        })
                    } else {
                        my_xhr.abort();
                        audioButton.textContent = `已取消下载`;
                        audioState = false;
                        setTimeout(() => { audioButton.textContent = `下载MP3` }, 1000);
                    }
                })
            }
        } else {
            removeDom(chooseEl(), "my_audio_button");
        }
        if (localStorage.getItem("myBiliMP4") && localStorage.getItem("myBiliMP4") == 'true') {
            if (location.href && !document.querySelector(".my_video_button")) {
                let videoButton = createNode('a', '下载MP4', 'my_video_button');
                videoButton.href = `http://zhouql.vip/bilibili/?${location.href}`;
                videoButton.target = `_blank`;
            }
        } else {
            removeDom(chooseEl(), "my_video_button");
        }
    }

    // 选择按钮正确挂载点，兼容旧播放器
    let chooseEl = () => {
        if (document.querySelector(".video-data-list")) return document.querySelector(".video-data-list");
        if (document.querySelector(".video-data")) return document.querySelector(".video-data");
    }

    // 创建按钮
    let createNode = (type, text, className) => {
        let node = document.createElement(type);
        node.textContent = text;
        node.className = className;
        node.style = `font-size:12px;text-decoration:none;padding:2px 6px;border-radius:4px;background-color:#fb819f;color:#fff;margin-left:6px`;
        chooseEl().appendChild(node);
        return node;
    }

    // 定时渲染
    setInterval(() => {
        renderButton();
    }, 1500)
})();

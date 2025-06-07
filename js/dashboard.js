    // dashboard.jsp와 동일한 전역 변수들
    let asChart; // AS 차트
    let osChart; // OS 차트
    let asstStatChart; // 상태 차트
    let curEvtBarChartInstance = null; // 사업별 자산 차트
    let relayLineChartInstance = null; // 중계 현황 라인 차트
    let relayChartInstance = null; // 중계 도넛 차트
    let licenseChartInstance = null; // 라이센스 도넛 차트
    let trainingChartInstance = null; // 연수 도넛 차트
    let rentalChartInstance = null; // 대여 도넛 차트
    
    var evtDashTableData = [];
    
    // 도넛 차트 중앙 텍스트 플러그인
    const centerTextPlugin = {
        id: "centerText",
        beforeDraw(chart) {
            if (!chart.options.plugins.centerText) return;
            
            const { ctx, width, height } = chart;
            const label = chart.options.plugins.centerText.label || '';
            const value = chart.options.plugins.centerText.value || '';

            if (!label && !value) return;

            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const centerX = width / 2;
            const centerY = height / 2;

            // 상단 텍스트: Total
            if (label) {
                ctx.font = "500 14px 'Pretendard Variable', 'Pretendard', sans-serif";
                ctx.fillStyle = "#666";
                ctx.fillText(label, centerX, centerY - 12);
            }

            // 중앙 숫자
            if (value) {
                ctx.font = "bold 20px 'Pretendard Variable', 'Pretendard', sans-serif";
                ctx.fillStyle = "#333";
                ctx.fillText(value, centerX, centerY + 8);
            }

            ctx.restore();
        }
    };

    $(document).ready(function() {
        // Chart.js 플러그인 등록
        if (typeof Chart !== 'undefined') {
            Chart.register(centerTextPlugin);
        } else {
            console.error('Chart.js가 로드되지 않았습니다.');
        }
        
        // 네비게이션 숨기기/보이기 토글 기능
        $('.navHidden button.HiddenBtn').on('click', function() {
            const $body = $('body');
            const $nav = $('#topmenu');
            
            // 토글 상태 확인
            if ($body.hasClass('nav-hidden')) {
                // 네비게이션 보이기
                $body.removeClass('nav-hidden');
                $nav.removeClass('hidden');
                console.log('네비게이션 보이기');
            } else {
                // 네비게이션 숨기기
                $body.addClass('nav-hidden');
                $nav.addClass('hidden');
                console.log('네비게이션 숨기기');
            }
        });
        
        // 네비게이션 토글 버튼 이벤트
        const toggleButton = document.getElementById('toggleButton');
        const gnbBot = document.querySelector('.gnbBot');
        const gnbContent = document.querySelector('.gnbContent');
        const navGrid = document.querySelector('.nav-grid-wrap');
        let isExpanded = true;

        toggleButton.addEventListener('click', function() {
            isExpanded = !isExpanded;
            if (isExpanded) {
                gnbBot.style.height = '38%';
                gnbContent.style.height = '62%';
                navGrid.style.height = '80%';
                toggleButton.innerHTML = '<i class="bi bi-chevron-down"></i>';
            } else {
                gnbBot.style.height = '0%';
                gnbContent.style.height = '100%';
                navGrid.style.height = '100%';
                toggleButton.innerHTML = '<i class="bi bi-chevron-up"></i>';
            }
        });


        // 대시보드 탭 전환
        $('.dashTab li').click(function() {
            $('.dashTab li').removeClass('active');
            $(this).addClass('active');
            
            const targetClass = $(this).data('target');
            $('.dashboardSection').hide();
            $('.' + targetClass).show();
            
            // 탭에 따른 차트 초기화
            if (targetClass === 'asDashboard') {
                // AS 대시보드 차트들을 다시 그리기
                setTimeout(() => {
                    initializeASCharts();
                    fn_searchOsCnt(); // OS 차트 다시 그리기
                    fn_searchAsstStatCnt(); // 상태 차트 다시 그리기
                }, 100);
            } else if (targetClass === 'assetDashboard') {
                // 자산 대시보드 차트들을 다시 그리기
                setTimeout(() => {
                    fn_searchSchlCnt(); // 학교현황 차트
                    fn_searchCurEvtAsstCnt(); // 사업별 자산 현황 차트
                    fn_searchCurEvtList(); // 사업현황 그리드
                    fn_searchOsCnt(); // OS 현황 차트
                    fn_searchAsstStatCnt(); // 자산 상태 차트
                    fn_searchRelayQty(); // 중계 현황 차트
                    fn_searchLcsQty(); // 라이센스 현황 차트
                    fn_searchTrainingQty(); // 연수 현황 차트
                    fn_searchRentalQty(); // 대여 현황 차트
                    
                    // 보유자산 그리드 초기화
                    if (typeof initMyProdListGrd === 'function') {
                        initMyProdListGrd();
                    }
                }, 100);
            }
        });

        // 자산 변동 현황 탭 전환 이벤트 (dashboard.jsp와 동일)
        const tabs = document.querySelectorAll(".asset_tab_menu li");
        const contents = document.querySelectorAll(".asset_tab_contents > li");

        tabs.forEach((tab, index) => {
            tab.addEventListener("click", function () {
                document.querySelector(".asset_tab_menu li.active").classList.remove("active");
                tab.classList.add("active");

                document.querySelector(".asset_tab_contents > li.active").classList.remove("active");
                contents[index].classList.add("active");
            });
        });

        // 보유자산리스트 메뉴 탭 전환 이벤트
        $('.myAsset_list_menu > li').on('click', function(e) {
            e.preventDefault();
            
            // 모든 li에서 active 클래스 제거
            $('.myAsset_list_menu > li').removeClass('active');
            
            // 클릭한 li에 active 클래스 추가
            $(this).addClass('active');
            
            // 해당하는 컨텐츠 표시
            const index = $(this).index();
            $('.myAsset_list_contents > li').removeClass('active');
            $('.myAsset_list_contents > li').eq(index).addClass('active');
            
            // 검색창 초기화
            $('#searchBox').val('');
            
            // 새로운 탭의 그리드 필터 초기화
            const currentGrid = index === 0 ? myProdListGrd : myPhoneListGrd;
            if (currentGrid) {
                currentGrid.clearFilter();
            }
            
            console.log('보유자산 메뉴 탭 변경:', $(this).find('.myAsset_title').text());
        });
        
        // dashboard.jsp와 동일한 초기화 함수 호출
        setData();
        eventHandler();
        
        // 차트 초기화를 약간 지연시켜 DOM이 완전히 준비되도록 함
        setTimeout(function() {
            // 1. 조직 트리 그리드 초기화
            initOrgTreeTable();
            setupOrgTreeEvents();
            
            // 2. 조직 트리 데이터 설정
            setTimeout(() => {
                fn_setSideCtpvOrgData();
                fn_setMngTitleData();
            }, 200);
            
            // 3. 대시보드 초기화 함수들 호출
            fn_searchCurEvtAsstCnt(); // 사업별 자산 현황 차트
            fn_searchSchlCnt(); // 학교 현황 차트
            fn_searchCurEvtList(); // 사업 현황 그리드
            fn_searchOsCnt(); // OS 현황 차트
            fn_searchAsstStatCnt(); // 자산 상태 차트
            fn_searchRelayQty(); // 중계 현황 차트
            fn_searchLcsQty(); // 라이센스 현황 차트
            fn_searchTrainingQty(); // 연수 현황 차트
            fn_searchRentalQty(); // 대여 현황 차트
            
                    // AS 차트 초기화
        initializeASCharts();
        
        // 보유자산 그리드 초기화
        initMyProdListGrd();
        
        // 검색 기능 초기화
        if (document.getElementById('searchBox')) {
            document.getElementById('searchBox').addEventListener('input', function(e) {
                const value = e.target.value.toLowerCase();
                
                // 현재 활성화된 탭의 그리드에만 필터 적용
                const activeTabIndex = $('.myAsset_list_menu > li.active').index();
                const currentGrid = activeTabIndex === 0 ? myProdListGrd : myPhoneListGrd;
                
                if (currentGrid) {
                    currentGrid.setFilter(function(row) {
                        const serialCustomer = row.getData().serialCustomer || "";
                        return serialCustomer.toLowerCase().includes(value);
                    });
                }
            });
        }
    }, 100);
    
    // 재집계 버튼 이벤트 추가
    $('#btnReaggregate1').on('click', function() {
            console.log('재집계 버튼 1 클릭됨');
            // 버튼 비활성화 (중복 클릭 방지)
            $(this).prop('disabled', true).text('처리중...');
            
            // 차트 재렌더링
            setTimeout(() => {
                fn_searchSchlCnt();
                
                // 버튼 다시 활성화
                setTimeout(() => {
                    $(this).prop('disabled', false).text('재집계');
                }, 500);
            }, 100);
        });
        
        $('#btnReaggregate2').on('click', function() {
            fn_searchCurEvtAsstCnt();
        });
        
        $('#btnReaggregate3').on('click', function() {
            fn_searchOsCnt();
        });
        
        $('#btnReaggregate4').on('click', function() {
            fn_searchAsstStatCnt();
        });
    });

    // 연수 현황 차트
    function fn_searchTrainingQty() {
        const trainingData = [
            { type: 'req', cnt: 80 },
            { type: 'prog', cnt: 45 },
            { type: 'comp', cnt: 120 }
        ];
        
        if ($('#trainingReq').length > 0) $('#trainingReq').text(trainingData[0].cnt);
        if ($('#trainingProg').length > 0) $('#trainingProg').text(trainingData[1].cnt);
        if ($('#trainingComp').length > 0) $('#trainingComp').text(trainingData[2].cnt);
        
        const canvas = document.getElementById('trainingChart');
        if (!canvas) {
            console.warn('trainingChart 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (trainingChartInstance) {
            trainingChartInstance.destroy();
        }
        
        trainingChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['연수신청', '연수중', '연수완료'],
                datasets: [{
                    data: trainingData.map(item => item.cnt),
                    backgroundColor: ['#fbbf24', '#f97316', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 대여 현황 차트
    function fn_searchRentalQty() {
        const rentalData = [
            { type: 'req', cnt: 60 },
            { type: 'prog', cnt: 35 },
            { type: 'comp', cnt: 95 }
        ];
        
        if ($('#rentalReq').length > 0) $('#rentalReq').text(rentalData[0].cnt);
        if ($('#rentalProg').length > 0) $('#rentalProg').text(rentalData[1].cnt);
        if ($('#rentalComp').length > 0) $('#rentalComp').text(rentalData[2].cnt);
        
        const canvas = document.getElementById('rentalChart');
        if (!canvas) {
            console.warn('rentalChart 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (rentalChartInstance) {
            rentalChartInstance.destroy();
        }
        
        rentalChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['대여신청', '대여중', '반납완료'],
                datasets: [{
                    data: rentalData.map(item => item.cnt),
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 하위조직 포함 체크박스 이벤트 (해당 요소가 있을 때만 동작)
    const orgAllYnElement = document.getElementById('orgAllYn');
    if (orgAllYnElement) {
        orgAllYnElement.addEventListener('change', function(e) {
            const allYn = e.target.checked ? 'Y' : 'N';
            // 여기에 데이터 새로고침 로직 추가
        });
    }

    // dashboard.jsp와 동일한 자산변동현황 그리드 데이터 로딩 함수
    function fn_loadGridData(gridId, url, paramData) {
        paramData.loading = false;
        paramData.ctpvEduCd = 'B10'; // 임시 값 (실제로는 세션에서 가져와야 함)
        paramData.orgCd = 'B10'; // 임시 값 (실제로는 세션에서 가져와야 함)
        
        $.post(url, paramData, function(res) {
            if (res.result.resultCode === 200) {
                const rawList = res.body || [];
                let color, imgSrc, label;
                
                switch (paramData.type) {
                    case "asstAdd":
                        color = "green";
                        imgSrc = "tab_img_green.png";
                        label = "스마트자산 추가";
                        break;
                    case "asstReq":
                        color = "purple";
                        imgSrc = "tab_img_purple.png";
                        label = "스마트자산 중계요청";
                        break;
                    case "asstAprv":
                        color = "green";
                        imgSrc = "tab_img_green.png";
                        label = "스마트자산 중계승인";
                        break;
                }
                
                const parsedData = rawList.map(function(item) {
                    return {
                        img: '<div class="img-wrapper"><img src="resources/images/content/' + imgSrc + '" alt="' + label + ' 아이콘"></div>',
                        details: '<div class="details"><span class="' + color + '_txt">' + label + '</span><br>' + (item.orgNm || "-") + '</div>',
                        deviceInfo: '<div class="details"><span class="deviceName ' + color + '_txt">' + (item.deviceCnt || "0") + '대</span><br><span class="deviceName">' + (item.prodNm || "") + '</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">' + (item.regYmd || "-") + '</span></div>'
                    };
                });
                createGrid(gridId, parsedData);
            } else {
                console.error("데이터 조회 실패:", res.result.message);
                // 에러 시 빈 데이터로 그리드 생성
                createGrid(gridId, []);
            }
        }).fail(function(err) {
            console.error("통신 에러:", err);
            // 통신 에러 시 샘플 데이터로 그리드 생성
            createGrid(gridId, getSampleData(paramData.type));
        });
    }

    // 그리드 생성 함수 (dashboard.jsp와 동일)
    function createGrid(gridId, data) {
        const gridElement = document.getElementById(gridId);
        if (!gridElement) return;

        // 총 건수 표시할 footer 요소 생성
        const footer = document.createElement("div");
        footer.className = "tabulator-footer";
        footer.innerHTML = `<span class="countNm">총 건수: ${data.length}건</span>`;

        if (!gridElement.classList.contains("initialized")) {
            const tableInstance = new Tabulator(gridElement, {
                layout: "fitColumns",
                responsiveLayout: "hide",
                headerVisible: true,
                footerElement: footer,
                columnDefaults: {
                    headerHozAlign: "center",
                    tooltip: true
                },
                columns: [
                    { title: "", field: "img", formatter: "html", width: 80 },
                    { title: "신청 및 학교", field: "details", formatter: "html", width: 150 },
                    { title: "기기정보 및 수량", field: "deviceInfo", formatter: "html", widthGrow: 1 },
                    { title: "등록일자", field: "regYmd", formatter: "html", widthGrow: 1 }
                ],
                pagination: "local",
                paginationSize: 10,
                paginationCounter: function(pageSize, currentRow, currentPage, totalRows, totalPages) {
                    return "총 건수 : " + totalRows;
                },
                data: data
            });
            gridElement.tabulator = tableInstance;
            gridElement.classList.add("initialized");
        } else {
            // 이미 생성된 경우 데이터만 업데이트
            const table = gridElement.tabulator;
            if (table) {
                table.setData(data);
                footer.innerHTML = `<span class="countNm">총 건수: ${data.length}건</span>`;
            } else {
                console.error("Tabulator 인스턴스를 찾을 수 없습니다.");
            }
        }
    }

    // 샘플 데이터 제공 함수 (서버 연결이 안될 때 사용)
    function getSampleData(type) {
        switch (type) {
            case "asstAdd":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_green.png" alt="스마트자산 추가 아이콘"></div>',
                        details: '<div class="details"><span class="green_txt">스마트자산 추가</span><br>청운중학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName green_txt">30대</span><br><span class="deviceName">갤럭시 탭 10+</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-15</span></div>'
                    }
                ];
            case "asstReq":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_purple.png" alt="스마트자산 중계요청 아이콘"></div>',
                        details: '<div class="details"><span class="purple_txt">스마트자산 중계요청</span><br>서울고등학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName purple_txt">25대</span><br><span class="deviceName">iPad Pro</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-14</span></div>'
                    }
                ];
            case "asstAprv":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_green.png" alt="스마트자산 중계승인 아이콘"></div>',
                        details: '<div class="details"><span class="green_txt">스마트자산 중계승인</span><br>강남중학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName green_txt">15대</span><br><span class="deviceName">Surface Pro</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-13</span></div>'
                    }
                ];
            default:
                return [];
        }
    }

    // dashboard.jsp와 동일한 데이터 설정 함수
    function setData(){
        var data = {};
        /* 당월 1일 말일 세팅 */
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const yesterday = new Date(today.getTime() - 86400000);
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // 날짜 요소가 있는 경우에만 설정
        if (document.getElementById('startDate')) {
            $('#startDate').val(formatDate(firstDay));
            $('#endDate').val(formatDate(lastDay));
        }
        $('#selectedStdYmd').val(formatDate(yesterday));
        $('#selectedStdYmd').attr('max', formatDate(today));
        
        // 세션 정보가 있다면 사용, 없으면 임시 값 사용
        data.ctpvEduCd = 'B10'; // 임시 값
        data.orgCd = 'B10'; // 임시 값
        data.loading = false;
        data.startDate = formatDate(firstDay).replace(/-/g, '');
        data.endDate = formatDate(lastDay).replace(/-/g, '');
        
        $('#assetTitle').text('[서울특별시교육청] 보유자산리스트');
        
        // 자산 데이터 로딩 - 실제 서버가 있을 때 사용
        /*
        $.post("/dashBoard/searchMyAsstMngList", data, (res)=>{
            if(res.result.resultCode == 200){
                fn_setMdlList(res.body);
            }
        });
        */
        
        // 자산변동현황 그리드 데이터 로딩
        fn_loadGridData("asset-table", "/dashBoard/searchAssetChgList", { type: "asstAdd", startDate: data.startDate, endDate: data.endDate });
        fn_loadGridData("asset-table2", "/dashBoard/searchAssetChgList", { type: "asstReq", startDate: data.startDate, endDate: data.endDate });
        fn_loadGridData("asset-table3", "/dashBoard/searchAssetChgList", { type: "asstAprv", startDate: data.startDate, endDate: data.endDate });
    }

    function eventHandler(){
        /* 기준일 클릭시 */
        $('#toggleStdYmd').on('click', function () {
            var input = document.getElementById('selectedStdYmd');
            input.focus();
            
            var event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(event);
        });
        
        /* 기준일 적용 클릭시 */
        $('#btnApplyDate').on('click', function () {
            const selectedDate = $('#selectedStdYmd').val();
            if (selectedDate) {
                // 선택된 날짜로 그리드 데이터 다시 로딩
                const dateStr = selectedDate.replace(/-/g, '');
                fn_loadGridData("asset-table", "/dashBoard/searchAssetChgList", { type: "asstAdd", startDate: dateStr, endDate: dateStr });
                fn_loadGridData("asset-table2", "/dashBoard/searchAssetChgList", { type: "asstReq", startDate: dateStr, endDate: dateStr });
                fn_loadGridData("asset-table3", "/dashBoard/searchAssetChgList", { type: "asstAprv", startDate: dateStr, endDate: dateStr });
            }
        });
    }

             // 사업현황 그리드 테이블 생성
     let evtDashTable;
     
     function initEvtDashTable() {
         if (evtDashTable) {
             evtDashTable.destroy();
         }
         evtDashTable = new Tabulator("#evtDash", {
             data: evtDashTableData,
             layout: "fitColumns",
             selectableRowsRollingSelection:true,
             selectable: true,
             rowHeight: 30,
             columnDefaults: {
                 headerHozAlign: "center",
                 tooltip : true
             },
             columns: [
                 { title: "No", field: "rowNum", width: 60, hozAlign : "center"  , formatter: function(cell) {
                     return cell.getValue() || cell.getRow().getPosition(true);
                 }},
                 { title: "사업명", field: "evtNm", hozAlign: "left" },
                 { title: "사업시작일", field: "evtStrYmd", hozAlign: "center" ,width:120},
                 { title: "사업종료일", field: "evtEndYmd", hozAlign: "center" ,width:120},
                 { 
                     title: "상태", 
                     field: "evtStatus", 
                     hozAlign: "center", 
                     width: 80,
                     formatter: function(cell) {
                         const value = cell.getValue();
                         return '<button class="butn btn-bgblue">' + value + '</button>';
                     },
                 }
             ],
             pagination: "local",
             paginationSize: 4,
             paginationCounter:function(pageSize, currentRow, currentPage, totalRows, totalPages){
                 return "총 건수 : " + totalRows + "건";
             },
             selectable: true,
         });
     }

    // 사업현황 그리드 데이터 로딩
    function fn_searchCurEvtList() {
        // 샘플 데이터로 대체 (실제로는 서버에서 가져옴)
        const sampleData = [
            {
                rowNum: 1,
                evtNm: "서울특별시교육청 혁신학교 스마트단말 도입 사업",
                evtStrYmd: "2020-03-21",
                evtEndYmd: "2026-12-08",
                evtStatus: "진행중"
            },
            {
                rowNum: 2,
                evtNm: "2022학년도 스마트기기 휴대 학습 「디벗」 사업",
                evtStrYmd: "2022-06-28",
                evtEndYmd: "2025-06-27",
                evtStatus: "진행중"
            },
            {
                rowNum: 3,
                evtNm: "2023학년도 스마트기기 휴대 학습「디벗」관련 기기 보급",
                evtStrYmd: "2023-12-20",
                evtEndYmd: "2029-12-19",
                evtStatus: "진행중"
            },
            {
                rowNum: 4,
                evtNm: "2024학년도 선도 학교 「디벗」 보급 사업",
                evtStrYmd: "2024-05-20",
                evtEndYmd: "2030-05-19",
                evtStatus: "진행중"
            },
            {
                rowNum: 5,
                evtNm: "AI 디지털교과서 활용 스마트교육 환경 구축 사업",
                evtStrYmd: "2024-01-15",
                evtEndYmd: "2027-12-31",
                evtStatus: "진행중"
            },
            {
                rowNum: 6,
                evtNm: "메타버스 기반 미래교실 구축 프로젝트",
                evtStrYmd: "2023-09-01",
                evtEndYmd: "2026-08-31",
                evtStatus: "진행중"
            },
            {
                rowNum: 7,
                evtNm: "창의융합형 과학실 스마트기기 보급 사업",
                evtStrYmd: "2024-03-01",
                evtEndYmd: "2025-02-28",
                evtStatus: "진행중"
            },
            {
                rowNum: 8,
                evtNm: "디지털 리터러시 향상을 위한 태블릿 보급 사업",
                evtStrYmd: "2023-03-01",
                evtEndYmd: "2025-02-28",
                evtStatus: "진행중"
            },
            {
                rowNum: 9,
                evtNm: "온라인 수업 지원 스마트패드 임대 사업",
                evtStrYmd: "2022-03-01",
                evtEndYmd: "2024-02-29",
                evtStatus: "완료"
            },
            {
                rowNum: 10,
                evtNm: "코딩교육 강화를 위한 교육용 노트북 보급",
                evtStrYmd: "2024-06-01",
                evtEndYmd: "2025-05-31",
                evtStatus: "진행중"
            },
            {
                rowNum: 11,
                evtNm: "특수학급 맞춤형 스마트기기 지원 사업",
                evtStrYmd: "2023-07-01",
                evtEndYmd: "2025-06-30",
                evtStatus: "진행중"
            },
            {
                rowNum: 12,
                evtNm: "농어촌지역 디지털격차 해소 태블릿 보급",
                evtStrYmd: "2023-01-01",
                evtEndYmd: "2024-12-31",
                evtStatus: "진행중"
            }
        ];
        
        // 사업현황 그리드 테이블 초기화 및 데이터 설정
        initEvtDashTable();
        
        // 데이터 설정을 약간 지연시켜 그리드가 완전히 초기화된 후 설정
        setTimeout(() => {
            if (evtDashTable) {
                evtDashTable.setData(sampleData);
            }
        }, 100);
    }

    // 학교현황 차트 그리기
    function fn_searchSchlCnt() {
        // 샘플 데이터로 차트 그리기
        const sampleData = {
            eduCnt: 400,
            doeCnt: 100,
            eleCnt: 600,
            midCnt: 380,
            highCnt: 320,
            spcCnt: 100
        };
        fn_drowSchlCntChart(sampleData);
    }

    function fn_drowSchlCntChart(data) {
        if (!data) {
            console.log('fn_drowSchlCntChart: 데이터가 없습니다');
            return;
        }
        
        console.log('학교현황 차트 데이터:', data);
        
        // 데이터 업데이트
        $('#eduCnt').text(data.eduCnt || 0);
        $('#doeCnt').text(data.doeCnt || 0);
        $('#eleCnt').text(data.eleCnt || 0);
        $('#midCnt').text(data.midCnt || 0);
        $('#highCnt').text(data.highCnt || 0);
        $('#spcCnt').text(data.spcCnt || 0);
        
        // 캔버스 요소 확인
        const canvas = document.getElementById('schoolCntBarChart');
        if (!canvas) {
            console.error('schoolCntBarChart 캔버스를 찾을 수 없습니다');
            return;
        }
        
        // 기존 차트 인스턴스 제거
        if (window.schoolCntChart) {
            window.schoolCntChart.destroy();
            window.schoolCntChart = null;
        }
        
        // Chart.js 플러그인 재등록 (안전성을 위해)
        if (!Chart.registry.plugins.get('centerText')) {
            Chart.register(centerTextPlugin);
        }
        
        console.log('학교현황 차트 생성 중...');
        
        const totalCount = (data.eduCnt || 0) + (data.doeCnt || 0) + (data.eleCnt || 0) + 
                          (data.midCnt || 0) + (data.highCnt || 0) + (data.spcCnt || 0);
        
        // requestAnimationFrame을 사용하여 다음 프레임에서 차트 생성
        requestAnimationFrame(() => {
            try {
                window.schoolCntChart = new Chart(canvas.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['교육청', '교육지원청', '초등학교', '중학교', '고등학교', '특수/기타'],
                        datasets: [{
                            data: [data.eduCnt || 0, data.doeCnt || 0, data.eleCnt || 0, 
                                   data.midCnt || 0, data.highCnt || 0, data.spcCnt || 0],
                            backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00be9e', '#4ecdc4'],
                            borderWidth: 0,
                            hoverBorderWidth: 2,
                            hoverBorderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        animation: {
                            animateRotate: true,
                            duration: 1000
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: true,
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: ${value}개 (${percentage}%)`;
                                    }
                                }
                            },
                            centerText: {
                                label: 'Total',
                                value: totalCount.toLocaleString()
                            }
                        }
                    }
                });
                console.log('학교현황 차트 생성 완료:', window.schoolCntChart);
            } catch (error) {
                console.error('학교현황 차트 생성 오류:', error);
            }
        });
    }

    // 사업별 자산 현황 차트
    function fn_searchCurEvtAsstCnt() {
        // 샘플 데이터로 차트 그리기
        const sampleData = [
            {
                evtNm: "스마트교육 기기 보급",
                총수량: 1000,
                정상: 800,
                수리중: 150,
                기타: 50
            },
            {
                evtNm: "디지털교과서 사업",
                총수량: 800,
                정상: 650,
                수리중: 100,
                기타: 50
            }
        ];
        fn_drowEvtAsstGraph(sampleData);
    }

    function fn_drowEvtAsstGraph(dataList) {
        if (!dataList || dataList.length === 0) {
            $("#btnReaggregate2").hide();
            $("#curEvtBarChart").parent().html('<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><p style="font-size: large; text-align: center; margin: 0;">해당 조직에서 진행 중인 사업이 없습니다.</p></div>');
            return;
        }

        let labelList = [];
        let _totalList = [];
        let _normalList = [];
        let _rtList = [];
        let _etcList = [];

        dataList.forEach(obj => {
            labelList.push(obj.evtNm);
            _totalList.push(obj.총수량 || 0);
            _normalList.push(obj.정상 || 0);
            _rtList.push(obj.수리중 || 0);
            _etcList.push(obj.기타 || 0);
        });

        const ctx = document.getElementById('curEvtBarChart').getContext('2d');

        if (curEvtBarChartInstance) {
            curEvtBarChartInstance.destroy();
        }

        curEvtBarChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelList,
                datasets: [
                    {
                        label: '총 수량',
                        backgroundColor: "#9b8df2",
                        data: _totalList
                    },
                    {
                        label: '정상',
                        backgroundColor: "#00c7b2",
                        data: _normalList
                    },
                    {
                        label: '수리중',
                        backgroundColor: "#78e3f2",
                        data: _rtList
                    },
                    {
                        label: '기타',
                        backgroundColor: "#f28cb1",
                        data: _etcList
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'start'
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        grid: { display: false },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // OS별 현황 차트
    function fn_searchOsCnt() {
        const sampleData = [
            { osGb: 0, cnt: 320 }, // Windows
            { osGb: 1, cnt: 450 }, // iOS
            { osGb: 2, cnt: 680 }, // Android
            { osGb: 3, cnt: 120 }, // whaleOS
            { osGb: 4, cnt: 200 }, // Chrome
            { osGb: 5, cnt: 80 }   // 기타
        ];
        fn_drowOsChart(sampleData);
    }

    function fn_drowOsChart(dataList) {
        if (!dataList) return;
        
        // 데이터 업데이트
        dataList.forEach(item => {
            const element = $('#osGb' + item.osGb);
            if (element.length > 0) {
                element.text(item.cnt || 0);
            }
        });
        
        const canvas = document.getElementById('donutOS');
        if (!canvas) {
            console.warn('donutOS 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (osChart) {
            osChart.destroy();
        }
        
        osChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Windows', 'iOS', 'Android', 'whaleOS', 'Chrome', '기타'],
                datasets: [{
                    data: dataList.map(item => item.cnt),
                    backgroundColor: ['#1b84ff', '#2e73af', '#6654fd', '#029fb3', '#fbbf24', '#f97316']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    centerText: {
                        label: 'Total',
                        value: dataList.reduce((sum, item) => sum + item.cnt, 0).toString()
                    }
                }
            }
        });
    }

    // 자산 상태별 현황 차트
    function fn_searchAsstStatCnt() {
        const sampleData = [
            { asstStatCd: 0, cnt: 1200 }, // 정상
            { asstStatCd: 1, cnt: 150 },  // 수리중
            { asstStatCd: 2, cnt: 80 },   // 대여중/미반납
            { asstStatCd: 3, cnt: 45 },   // 분실
            { asstStatCd: 4, cnt: 25 },   // 폐기
            { asstStatCd: 5, cnt: 30 }    // 기타
        ];
        fn_drowAsstStatChart(sampleData);
    }

    function fn_drowAsstStatChart(dataList) {
        if (!dataList) return;
        
        // 데이터 업데이트
        dataList.forEach(item => {
            const element = $('#asstStat' + item.asstStatCd);
            if (element.length > 0) {
                element.text(item.cnt || 0);
            }
        });
        
        const canvas = document.getElementById('donutStatus');
        if (!canvas) {
            console.warn('donutStatus 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (asstStatChart) {
            asstStatChart.destroy();
        }
        
        asstStatChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['정상', '수리중', '대여중/미반납', '분실', '폐기', '기타'],
                datasets: [{
                    data: dataList.map(item => item.cnt),
                    backgroundColor: ['#10b981', '#f97316', '#3b82f6', '#ef4444', '#6b7280', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    centerText: {
                        label: 'Total',
                        value: dataList.reduce((sum, item) => sum + item.cnt, 0).toString()
                    }
                }
            }
        });
    }

    // 중계 현황 차트들
    function fn_searchRelayQty() {
        // 월별 중계 현황 라인 차트
        const lineData = {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
            datasets: [{
                label: '중계 건수',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: '#1b84ff',
                backgroundColor: '#1b84ff20'
            }]
        };
        
        const lineCanvas = document.getElementById('relayLineChart');
        if (!lineCanvas) {
            console.warn('relayLineChart 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        const lineCtx = lineCanvas.getContext('2d');
        if (relayLineChartInstance) {
            relayLineChartInstance.destroy();
        }
        
        relayLineChartInstance = new Chart(lineCtx, {
            type: 'line',
            data: lineData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // 중계 현황 도넛 차트
        const relayData = [
            { type: 'req', cnt: 120 },
            { type: 'prog', cnt: 80 },
            { type: 'comp', cnt: 200 }
        ];
        
        $('#relayReq').text(relayData[0].cnt);
        $('#relayProg').text(relayData[1].cnt);
        $('#relayComp').text(relayData[2].cnt);
        
        const relayCanvas = document.getElementById('relayChart');
        if (!relayCanvas) {
            console.warn('relayChart 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        const relayCtx = relayCanvas.getContext('2d');
        if (relayChartInstance) {
            relayChartInstance.destroy();
        }
        
        relayChartInstance = new Chart(relayCtx, {
            type: 'doughnut',
            data: {
                labels: ['중계요청', '중계진행', '중계완료'],
                datasets: [{
                    data: relayData.map(item => item.cnt),
                    backgroundColor: ['#fbbf24', '#f97316', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 라이센스 현황 차트
    function fn_searchLcsQty() {
        const licenseData = [
            { type: 'total', cnt: 500 },
            { type: 'use', cnt: 350 },
            { type: 'unuse', cnt: 150 }
        ];
        
        $('#totalLcs').text(licenseData[0].cnt);
        $('#useLcs').text(licenseData[1].cnt);
        $('#unuseLcs').text(licenseData[2].cnt);
        
        const canvas = document.getElementById('licenseChart');
        if (!canvas) {
            console.warn('licenseChart 요소를 찾을 수 없습니다. 차트를 건너뜁니다.');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (licenseChartInstance) {
            licenseChartInstance.destroy();
        }
        
        licenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['전체', '사용중', '미사용'],
                datasets: [{
                    data: licenseData.map(item => item.cnt),
                    backgroundColor: ['#3b82f6', '#10b981', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // AS 차트 초기화
    function initializeASCharts() {
        // AS 요청 도넛 차트
        const asReqCtx = document.getElementById('donutAsReq');
        if (asReqCtx) {
            if (window.asReqChart) {
                window.asReqChart.destroy();
            }
            
            const totalAsReq = 18 + 25 + 38 + 45 + 56;
            
            window.asReqChart = new Chart(asReqCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['모니터 불량', '인터넷 연결', 'PC 부팅', '프린터', '프로그램 오류'],
                    datasets: [{
                        data: [18, 25, 38, 45, 56],
                        backgroundColor: ['#1b84ff', '#2e73af', '#6654fd', '#029fb3', '#e74a3b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        centerText: {
                            label: 'Total',
                            value: totalAsReq.toString()
                        }
                    }
                }
            });
        }

        // AS 조치 TOP5 도넛 차트
        const asTopCtx = document.getElementById('asTopDonutChart');
        if (asTopCtx) {
            if (window.asTopChart) {
                window.asTopChart.destroy();
            }
            
            const totalAsTop = 70 + 40 + 30 + 20 + 10;
            
            window.asTopChart = new Chart(asTopCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['부품교체', '소프트웨어 재설치', '재부팅', '장비점검', '현장점검'],
                    datasets: [{
                        data: [70, 40, 30, 20, 10],
                        backgroundColor: ['#e9578c', '#f17ca0', '#fca3b7', '#ff6868', '#ff8f70']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        centerText: {
                            label: 'Total',
                            value: totalAsTop.toString()
                        }
                    }
                }
            });
        }

        // AS 진행상태별 현황 차트
        const asProgressCtx = document.getElementById('asProgress');
        if (asProgressCtx) {
            if (window.asProgressChart) {
                window.asProgressChart.destroy();
            }
            
            window.asProgressChart = new Chart(asProgressCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['접수', '진행중', '완료', '반려'],
                    datasets: [{
                        data: [120, 80, 200, 15],
                        backgroundColor: ['#fbbf24', '#f97316', '#10b981', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        centerText: {
                            label: 'Total',
                            value: '415'
                        }
                    }
                }
            });
        }

        // AS 진행현황 막대+선 차트
        const asChartCtx = document.getElementById('asChart');
        if (asChartCtx) {
            if (window.asLineChart) {
                window.asLineChart.destroy();
            }
            
            window.asLineChart = new Chart(asChartCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                    datasets: [{
                        label: 'AS 요청건',
                        type: 'bar',
                        data: [120, 110, 135, 140, 125, 115, 130, 145, 150, 135, 140, 155],
                        backgroundColor: '#1aafed',
                        borderColor: '#1aafed',
                        borderWidth: 1,
                        yAxisID: 'y',
                        order: 2
                    }, {
                        label: 'AS 진행건',
                        type: 'bar',
                        data: [30, 28, 35, 38, 32, 29, 33, 40, 42, 36, 38, 45],
                        backgroundColor: '#4bc0c0',
                        borderColor: '#4bc0c0',
                        borderWidth: 1,
                        yAxisID: 'y',
                        order: 2
                    }, {
                        label: 'AS 완료건',
                        type: 'line',
                        data: [90, 82, 100, 102, 93, 86, 97, 105, 108, 99, 102, 110],
                        borderColor: '#ffb800',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: '#ffb800',
                        pointBorderColor: '#ffb800',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0,
                        yAxisID: 'y',
                        order: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { 
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    return tooltipItems[0].label;
                                },
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + '건';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            grid: { display: false },
                            categoryPercentage: 0.8,
                            barPercentage: 0.9
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { display: true, color: '#f0f0f0' },
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + '건';
                                }
                            }
                        }
                    }
                }
            });
        }

        // 지원청별 AS 현황 차트
        const asStatusCtx = document.getElementById('asStatusChart');
        if (asStatusCtx) {
            if (window.asStatusChart) {
                window.asStatusChart.destroy();
            }
            
            window.asStatusChart = new Chart(asStatusCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['강남서초', '강동송파', '강서양천', '성동광진', '동대문중랑'],
                    datasets: [{
                        label: 'AS 요청',
                        data: [120, 100, 80, 90, 110],
                        backgroundColor: '#fbbf24'
                    }, {
                        label: 'AS 진행',
                        data: [30, 25, 20, 22, 28],
                        backgroundColor: '#f97316'
                    }, {
                        label: 'AS 완료',
                        data: [90, 75, 60, 68, 82],
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { display: false }, beginAtZero: true }
                    }
                }
            });
        }

        // 학교별 AS 현황 TOP20 차트
        const schoolAsCtx = document.getElementById('schoolAsChart');
        if (schoolAsCtx) {
            if (window.schoolAsChart) {
                window.schoolAsChart.destroy();
            }
            
            window.schoolAsChart = new Chart(schoolAsCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['청담초', '개포초', '대치초', '논현초', '강남중', '서초중', '서초고', '강남고', '잠실초', '방이초'],
                    datasets: [{
                        label: 'AS 요청',
                        data: [25, 22, 20, 18, 15, 14, 12, 11, 10, 9],
                        backgroundColor: '#fbbf24'
                    }, {
                        label: 'AS 완료',
                        data: [20, 18, 16, 15, 12, 11, 10, 9, 8, 7],
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        x: { grid: { display: false }, beginAtZero: true },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // dashboard.jsp와 동일한 자산변동현황 그리드 데이터 로딩 함수
    function fn_loadGridData(gridId, url, paramData) {
        console.log('fn_loadGridData 호출:', gridId, paramData.type);
        paramData.loading = false;
        paramData.ctpvEduCd = 'B10'; // 임시 값 (실제로는 세션에서 가져와야 함)
        paramData.orgCd = 'B10'; // 임시 값 (실제로는 세션에서 가져와야 함)
        
        // 샘플 데이터로 그리드 생성 (서버 통신 대신)
        createGrid(gridId, getSampleData(paramData.type));
        
        /* 서버 통신 버전 (필요시 사용)
        $.post(url, paramData, function(res) {
            if (res.result.resultCode === 200) {
                const rawList = res.body || [];
                let color, imgSrc, label;
                
                switch (paramData.type) {
                    case "asstAdd":
                        color = "green";
                        imgSrc = "tab_img_green.png";
                        label = "스마트자산 추가";
                        break;
                    case "asstReq":
                        color = "purple";
                        imgSrc = "tab_img_purple.png";
                        label = "스마트자산 중계요청";
                        break;
                    case "asstAprv":
                        color = "green";
                        imgSrc = "tab_img_green.png";
                        label = "스마트자산 중계승인";
                        break;
                }
                
                const parsedData = rawList.map(function(item) {
                    return {
                        img: '<div class="img-wrapper"><img src="resources/images/content/' + imgSrc + '" alt="' + label + ' 아이콘"></div>',
                        details: '<div class="details"><span class="' + color + '_txt">' + label + '</span><br>' + (item.orgNm || "-") + '</div>',
                        deviceInfo: '<div class="details"><span class="deviceName ' + color + '_txt">' + (item.deviceCnt || "0") + '대</span><br><span class="deviceName">' + (item.prodNm || "") + '</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">' + (item.regYmd || "-") + '</span></div>'
                    };
                });
                createGrid(gridId, parsedData);
            } else {
                console.error("데이터 조회 실패:", res.result.message);
                createGrid(gridId, getSampleData(paramData.type));
            }
        }).fail(function(err) {
            console.error("통신 에러:", err);
            createGrid(gridId, getSampleData(paramData.type));
        });
        */
    }

    // 그리드 생성 함수 (dashboard.jsp와 동일)
    function createGrid(gridId, data) {
        const gridElement = document.getElementById(gridId);
        if (!gridElement) return;

        if (!gridElement.classList.contains("initialized")) {
            const tableInstance = new Tabulator(gridElement, {
                layout: "fitColumns",
                responsiveLayout: "hide",
                headerVisible: true,
                columnDefaults: {
                    headerHozAlign: "center",
                    tooltip: true
                },
                columns: [
                    { title: "", field: "img", formatter: "html", width: 80 },
                    { title: "신청 및 학교", field: "details", formatter: "html", width: 150 },
                    { title: "기기정보 및 수량", field: "deviceInfo", formatter: "html", widthGrow: 1 },
                    { title: "등록일자", field: "regYmd", formatter: "html", widthGrow: 1 }
                ],
                pagination: "local",
                paginationSize: 10,
                paginationCounter: function(pageSize, currentRow, currentPage, totalRows, totalPages) {
                    return "총 건수 : " + totalRows;
                },
                data: data
            });
            gridElement.tabulator = tableInstance;
            gridElement.classList.add("initialized");
        } else {
            const table = gridElement.tabulator;
            if (table) {
                table.setData(data);
            }
        }
    }

    // 샘플 데이터 제공 함수
    function getSampleData(type) {
        switch (type) {
            case "asstAdd":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_green.png" alt="스마트자산 추가 아이콘"></div>',
                        details: '<div class="details"><span class="green_txt">스마트자산 추가</span><br>청운중학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName green_txt">30대</span><br><span class="deviceName">갤럭시 탭 10+</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-15</span></div>'
                    }
                ];
            case "asstReq":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_purple.png" alt="스마트자산 중계요청 아이콘"></div>',
                        details: '<div class="details"><span class="purple_txt">스마트자산 중계요청</span><br>서울고등학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName purple_txt">25대</span><br><span class="deviceName">iPad Pro</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-14</span></div>'
                    }
                ];
            case "asstAprv":
                return [
                    {
                        img: '<div class="img-wrapper"><img src="images/content/tab_img_green.png" alt="스마트자산 중계승인 아이콘"></div>',
                        details: '<div class="details"><span class="green_txt">스마트자산 중계승인</span><br>강남중학교</div>',
                        deviceInfo: '<div class="details"><span class="deviceName green_txt">15대</span><br><span class="deviceName">Surface Pro</span></div>',
                        regYmd: '<div class="deviceInfo"><span class="deviceName">2025-01-13</span></div>'
                    }
                ];
            default:
                return [];
        }
    }

    // 보유자산 리스트 그리드 초기화
    let myProdListGrd;
    let myPhoneListGrd;
    
    function initMyProdListGrd() {
        console.log('initMyProdListGrd 함수 호출됨');
        
        // DOM 요소 확인
        const myProdListElement = document.getElementById('myProdList');
        console.log('myProdList 요소:', myProdListElement);
        
        if (!myProdListElement) {
            console.error('myProdList 요소를 찾을 수 없습니다!');
            return;
        }
        
        console.log('myProdList 그리드 생성 시작...');
        
        // 모니터 그리드
        try {
            myProdListGrd = new Tabulator("#myProdList", {
            columns: [
                { 
                    title: "", 
                    field: "img", 
                    formatter: "html",
                    width: 60,
                    headerSort: false
                },
                { 
                    title: "자산정보", 
                    field: "product", 
                    formatter: "html",
                    headerSort: false
                },
                { 
                    title: "자산상세", 
                    field: "serialCustomer", 
                    formatter: "html",
                    headerSort: false
                },
                { 
                    title: "등록정보", 
                    field: "dateStatus", 
                    formatter: "html",
                    headerSort: false
                },
                {
                    title: "AS",
                    field: "AS",
                    formatter: "html",
                    width: 80,
                    headerSort: false
                },
                {
                    title: "이관",
                    field: "move",
                    formatter: "html",
                    width: 80,
                    headerSort: false
                }
            ],
            data: [
                { 
                    img: '<div class="prd-img-wrapper"><img src="images/main/smart_machine3.png" alt="스마트기기"></div>',
                    product: '<div class="details"><strong>갤럭시 탭</strong><br><span class="brand">스마트기기</span></div>',
                    serialCustomer: '<div class="details"><strong>자산관리번호 : ASST2024001</strong><br><span class="customer">단말일련번호 : SM-T860N</span></div>',
                    dateStatus: '<div class="details"><strong>2024-03-25</strong><br><span class="status green">사용중</span></div>',
                    AS: '<button type="button" class="butn btn-bgblue asBtn">AS</button>',
                    move: '<button type="button" class="butn btn-bgGray moveBtn" style="height:34px;"><i class="bi bi-arrow-right"></i></button>'
                },
                { 
                    img: '<div class="prd-img-wrapper"><img src="images/main/smart_machine2.png" alt="스마트기기"></div>',
                    product: '<div class="details"><strong>갤럭시 탭</strong><br><span class="brand">스마트기기</span></div>',
                    serialCustomer: '<div class="details"><strong>자산관리번호 : ASST2024002</strong><br><span class="customer">단말일련번호 : SM-T860N</span></div>',
                    dateStatus: '<div class="details"><strong>2024-03-24</strong><br><span class="status blue">대기중</span></div>',
                    AS: '<button type="button" class="butn btn-bgblue asBtn">AS</button>',
                    move: '<button type="button" class="butn btn-bgGray moveBtn" style="height:34px;"><i class="bi bi-arrow-right"></i></button>'
                }
            ],
            layout: "fitColumns",
            height: "100%",
            headerSort: false,
            headerVisible: false
        });
        console.log('myProdList 그리드 생성 완료:', myProdListGrd);
        } catch (error) {
            console.error('myProdList 그리드 생성 오류:', error);
            return;
        }

        // 스마트폰 그리드
        try {
        myPhoneListGrd = new Tabulator("#myPhoneList", {
            columns: [
                { 
                    title: "", 
                    field: "img", 
                    formatter: "html",
                    width: 60,
                    headerSort: false
                },
                { 
                    title: "자산정보", 
                    field: "product", 
                    formatter: "html",
                    headerSort: false
                },
                { 
                    title: "자산상세", 
                    field: "serialCustomer", 
                    formatter: "html",
                    headerSort: false
                },
                { 
                    title: "등록정보", 
                    field: "dateStatus", 
                    formatter: "html",
                    headerSort: false
                },
                {
                    title: "AS",
                    field: "AS",
                    formatter: "html",
                    width: 80,
                    headerSort: false
                },
                {
                    title: "이관",
                    field: "move",
                    formatter: "html",
                    width: 80,
                    headerSort: false
                }
            ],
            data: [
                { 
                    img: '<div class="prd-img-wrapper"><img src="images/main/smart_machine1.png" alt="스마트폰"></div>',
                    product: '<div class="details"><strong>갤럭시 S24</strong><br><span class="brand">스마트폰</span></div>',
                    serialCustomer: '<div class="details"><strong>자산관리번호 : ASST2024003</strong><br><span class="customer">단말일련번호 : SM-S928N</span></div>',
                    dateStatus: '<div class="details"><strong>2024-03-20</strong><br><span class="status green">사용중</span></div>',
                    AS: '<button type="button" class="butn btn-bgblue asBtn">AS</button>',
                    move: '<button type="button" class="butn btn-bgGray moveBtn" style="height:34px;"><i class="bi bi-arrow-right"></i></button>'
                },
                { 
                    img: '<div class="prd-img-wrapper"><img src="images/main/smart_machine1.png" alt="스마트폰"></div>',
                    product: '<div class="details"><strong>iPhone 15</strong><br><span class="brand">스마트폰</span></div>',
                    serialCustomer: '<div class="details"><strong>자산관리번호 : ASST2024004</strong><br><span class="customer">단말일련번호 : A3000</span></div>',
                    dateStatus: '<div class="details"><strong>2024-03-18</strong><br><span class="status orange">수리중</span></div>',
                    AS: '<button type="button" class="butn btn-bgblue asBtn">AS</button>',
                    move: '<button type="button" class="butn btn-bgGray moveBtn" style="height:34px;"><i class="bi bi-arrow-right"></i></button>'
                }
            ],
            layout: "fitColumns",
            height: "100%",
            headerSort: false,
            headerVisible: false
        });
        console.log('myPhoneList 그리드 생성 완료:', myPhoneListGrd);
        } catch (error) {
            console.error('myPhoneList 그리드 생성 오류:', error);
        }
    }

    // ===== 조직 트리 그리드 (nav.jsp와 동일) =====
    var tableDataNested = [];
    var ctpvOrgSideTable = null;
    
    function initOrgTreeTable() {
        ctpvOrgSideTable = new Tabulator("#tree-table", {
            data: [],
            selectable: true,
            selectableRows: 1,
            selectableRowsRollingSelection: true, 
            layout: "fitColumns",
            dataTreeStartExpanded: [true, false],
            dataTree: true,
            height: "100%",
            headerVisible: true,
            rowFormatter: function(row) {
                requestAnimationFrame(() => {
                    const el = row.getElement();
                    const branch = el.querySelector(".tabulator-data-tree-branch");
                    if (branch) {
                        let depth = getDepthFromRoot(row);
                        let indent = 0;
                        switch (depth) {
                        case 1:
                            indent = 20;
                            break;
                        case 2:
                            indent = 55;
                            break;
                        }
                        branch.style.marginLeft = indent + "px";
                    }
                });
            },
            columns: [
                {
                    title: "조직구조", 
                    field: "orgNm",
                    sorter: "string",
                    headerSort: false,
                    headerFilter: "input",  // 검색창 추가
                    headerFilterPlaceholder: "조직 검색", // 검색창 Placeholder 추가
                    headerFilterFunc: function(headerValue, rowValue, rowData, column, e, row) {
                        return fn_navOrgSearch(rowData, headerValue.toLowerCase());
                    },
                    headerFilterParams: {
                        class: "custom-search-input" // input에 클래스 추가
                    }
                }
            ]
        });
        
        console.log('조직 트리 그리드 초기화 완료');
    }
    
    function getDepthFromRoot(row) {
        let depth = 0;
        let current = row;
        while (current.getTreeParent?.()) {
            depth++;
            current = current.getTreeParent();
        }
        return depth;
    }
    
    // 왼쪽 org 검색
    function fn_navOrgSearch(node, keyword) {
        if (node.orgNm && node.orgNm.toLowerCase().includes(keyword)) {
            return true;
        }
        if (node._children && node._children.length > 0) {
            for (let child of node._children) {
                if (fn_navOrgSearch(child, keyword)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /* 트리에서 조직 클릭시 */
    function setupOrgTreeEvents() {
        if (ctpvOrgSideTable) {
            ctpvOrgSideTable.on('rowClick',function(e, row){
                var data = row.getData();
                console.log('조직 선택:', data);
                
                // 조직 정보 업데이트
                $('.org_name span').text(data.orgNm || '교육청/학교명');
                
                // 스마트자산 및 AS 건수 업데이트
                fn_setMngTitleData(data.ctpvEduCd, data.orgCd);
                
                // 보유자산 제목 업데이트
                $('#assetTitle').text('[' + (data.orgNm || '서울특별시교육청') + '] 보유자산리스트');
                
                console.log('차트 업데이트 시작...');
                
                // 대시보드 차트들 업데이트
                try {
                    console.log('학교현황 차트 업데이트...');
                    if (typeof fn_searchSchlCnt === 'function') fn_searchSchlCnt();
                    
                    console.log('OS현황 차트 업데이트...');
                    if (typeof fn_searchOsCnt === 'function') fn_searchOsCnt();
                    
                    console.log('자산상태 차트 업데이트...');
                    if (typeof fn_searchAsstStatCnt === 'function') fn_searchAsstStatCnt();
                    
                    console.log('중계현황 차트 업데이트...');
                    if (typeof fn_searchRelayQty === 'function') fn_searchRelayQty();
                    
                    console.log('라이센스현황 차트 업데이트...');
                    if (typeof fn_searchLcsQty === 'function') fn_searchLcsQty();
                    
                    console.log('연수현황 차트 업데이트...');
                    if (typeof fn_searchTrainingQty === 'function') fn_searchTrainingQty();
                    
                    console.log('대여현황 차트 업데이트...');
                    if (typeof fn_searchRentalQty === 'function') fn_searchRentalQty();
                    
                    console.log('사업별 자산현황 차트 업데이트...');
                    if (typeof fn_searchCurEvtAsstCnt === 'function') fn_searchCurEvtAsstCnt();
                } catch (error) {
                    console.error('차트 업데이트 중 오류:', error);
                }
                
                // 자산변동현황 그리드 다시 로딩
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };
                
                const startDate = formatDate(firstDay).replace(/-/g, '');
                const endDate = formatDate(lastDay).replace(/-/g, '');
                
                if (typeof fn_loadGridData === "function") {
                    fn_loadGridData("asset-table", "/dashBoard/searchAssetChgList", { type: "asstAdd", startDate, endDate });
                    fn_loadGridData("asset-table2", "/dashBoard/searchAssetChgList", { type: "asstReq", startDate, endDate });
                    fn_loadGridData("asset-table3", "/dashBoard/searchAssetChgList", { type: "asstAprv", startDate, endDate });
                }
            });
        }
    }
    
    // 조직 트리 데이터 설정
    function fn_setSideCtpvOrgData(){
        if (!ctpvOrgSideTable) {
            console.error('조직 트리 그리드가 초기화되지 않았습니다.');
            return;
        }
        
        // 더 풍부한 샘플 조직 트리 데이터
        const sampleOrgData = [
            {
                id: 1,
                orgCd: "B10",
                ctpvEduCd: "B10",
                orgNm: "서울특별시교육청",
                _children: [
                    {
                        id: 11,
                        orgCd: "B1001", 
                        ctpvEduCd: "B10",
                        orgNm: "강남서초교육지원청",
                        _children: [
                            { id: 111, orgCd: "B100101", ctpvEduCd: "B10", orgNm: "청담초등학교" },
                            { id: 112, orgCd: "B100102", ctpvEduCd: "B10", orgNm: "개포초등학교" },
                            { id: 113, orgCd: "B100103", ctpvEduCd: "B10", orgNm: "대치초등학교" },
                            { id: 114, orgCd: "B100104", ctpvEduCd: "B10", orgNm: "논현초등학교" },
                            { id: 115, orgCd: "B100105", ctpvEduCd: "B10", orgNm: "강남중학교" },
                            { id: 116, orgCd: "B100106", ctpvEduCd: "B10", orgNm: "서초중학교" },
                            { id: 117, orgCd: "B100107", ctpvEduCd: "B10", orgNm: "서초고등학교" },
                            { id: 118, orgCd: "B100108", ctpvEduCd: "B10", orgNm: "강남고등학교" }
                        ]
                    },
                    {
                        id: 12,
                        orgCd: "B1002",
                        ctpvEduCd: "B10", 
                        orgNm: "강동송파교육지원청",
                        _children: [
                            { id: 121, orgCd: "B100201", ctpvEduCd: "B10", orgNm: "잠실초등학교" },
                            { id: 122, orgCd: "B100202", ctpvEduCd: "B10", orgNm: "방이초등학교" },
                            { id: 123, orgCd: "B100203", ctpvEduCd: "B10", orgNm: "문정초등학교" },
                            { id: 124, orgCd: "B100204", ctpvEduCd: "B10", orgNm: "천호초등학교" },
                            { id: 125, orgCd: "B100205", ctpvEduCd: "B10", orgNm: "송파중학교" },
                            { id: 126, orgCd: "B100206", ctpvEduCd: "B10", orgNm: "강동중학교" },
                            { id: 127, orgCd: "B100207", ctpvEduCd: "B10", orgNm: "강동고등학교" },
                            { id: 128, orgCd: "B100208", ctpvEduCd: "B10", orgNm: "송파고등학교" }
                        ]
                    },
                    {
                        id: 13,
                        orgCd: "B1003",
                        ctpvEduCd: "B10",
                        orgNm: "강서양천교육지원청", 
                        _children: [
                            { id: 131, orgCd: "B100301", ctpvEduCd: "B10", orgNm: "가양초등학교" },
                            { id: 132, orgCd: "B100302", ctpvEduCd: "B10", orgNm: "화곡초등학교" },
                            { id: 133, orgCd: "B100303", ctpvEduCd: "B10", orgNm: "염창초등학교" },
                            { id: 134, orgCd: "B100304", ctpvEduCd: "B10", orgNm: "목동초등학교" },
                            { id: 135, orgCd: "B100305", ctpvEduCd: "B10", orgNm: "양천중학교" },
                            { id: 136, orgCd: "B100306", ctpvEduCd: "B10", orgNm: "강서중학교" },
                            { id: 137, orgCd: "B100307", ctpvEduCd: "B10", orgNm: "강서고등학교" },
                            { id: 138, orgCd: "B100308", ctpvEduCd: "B10", orgNm: "양천고등학교" }
                        ]
                    },
                    {
                        id: 14,
                        orgCd: "B1004",
                        ctpvEduCd: "B10",
                        orgNm: "성동광진교육지원청",
                        _children: [
                            { id: 141, orgCd: "B100401", ctpvEduCd: "B10", orgNm: "성동초등학교" },
                            { id: 142, orgCd: "B100402", ctpvEduCd: "B10", orgNm: "광진초등학교" },
                            { id: 143, orgCd: "B100403", ctpvEduCd: "B10", orgNm: "왕십리초등학교" },
                            { id: 144, orgCd: "B100404", ctpvEduCd: "B10", orgNm: "구의초등학교" },
                            { id: 145, orgCd: "B100405", ctpvEduCd: "B10", orgNm: "성동중학교" },
                            { id: 146, orgCd: "B100406", ctpvEduCd: "B10", orgNm: "광진중학교" },
                            { id: 147, orgCd: "B100407", ctpvEduCd: "B10", orgNm: "성동고등학교" },
                            { id: 148, orgCd: "B100408", ctpvEduCd: "B10", orgNm: "광진고등학교" }
                        ]
                    },
                    {
                        id: 15,
                        orgCd: "B1005",
                        ctpvEduCd: "B10",
                        orgNm: "동대문중랑교육지원청",
                        _children: [
                            { id: 151, orgCd: "B100501", ctpvEduCd: "B10", orgNm: "동대문초등학교" },
                            { id: 152, orgCd: "B100502", ctpvEduCd: "B10", orgNm: "중랑초등학교" },
                            { id: 153, orgCd: "B100503", ctpvEduCd: "B10", orgNm: "청량리초등학교" },
                            { id: 154, orgCd: "B100504", ctpvEduCd: "B10", orgNm: "면목초등학교" },
                            { id: 155, orgCd: "B100505", ctpvEduCd: "B10", orgNm: "동대문중학교" },
                            { id: 156, orgCd: "B100506", ctpvEduCd: "B10", orgNm: "중랑중학교" },
                            { id: 157, orgCd: "B100507", ctpvEduCd: "B10", orgNm: "동대문고등학교" },
                            { id: 158, orgCd: "B100508", ctpvEduCd: "B10", orgNm: "중랑고등학교" }
                        ]
                    }
                ]
            }
        ];
        
        console.log('조직 트리 데이터 설정:', sampleOrgData);
        
        try {
            ctpvOrgSideTable.setData(sampleOrgData);
            console.log('조직 트리 데이터 설정 완료');
            
            // 최상위 노드 자동 확장
            setTimeout(() => {
                const rows = ctpvOrgSideTable.getRows();
                if (rows.length > 0) {
                    rows[0].treeExpand();
                    console.log('조직 트리 최상위 노드 확장 완료');
                }
            }, 300);
        } catch (error) {
            console.error('조직 트리 데이터 설정 중 오류:', error);
        }
    }
    
    //스마트단말 대수, AS 건수 설정
    function fn_setMngTitleData(ctpvEduCd, orgCd) {
        // 샘플 데이터로 업데이트
        const sampleMngData = {
            smtCnt: 1850,
            asrvCnt: 73
        };
        
        $('#smtCnt').text(sampleMngData.smtCnt.toLocaleString());
        $('#asrvCnt').text(sampleMngData.asrvCnt.toLocaleString());
        
        /* 실제 서버 통신 버전
        var data = {};
        data.ctpvEduCd = ctpvEduCd || "B10";
        data.orgCd = orgCd || "B10";
        data.loading = false;
        
        $.post("/side/searchMngTitleData", data, (res) => {
            if(res.result.resultCode == 200) {
                $('#smtCnt').text(res.body.smtCnt.toLocaleString());
                $('#asrvCnt').text(res.body.asrvCnt.toLocaleString());
            } else {
                $('#smtCnt, #asrvCnt').text("조회 실패"); 
            }
        });
        */
    }

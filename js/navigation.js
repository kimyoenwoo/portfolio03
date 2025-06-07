$(document).ready(function() {
    // Sdown 클릭 시 서브 메뉴 열기
    $('i.Sdown').click(function(e) {
        e.stopPropagation(); // 부모 클릭 이벤트 방지
        const $parentLi = $(this).closest('li');
        const $subMenu = $parentLi.find('ul.sub_menu');
        const $gnbLink = $parentLi.closest('li').children('a'); // gnb > li > a 선택

        // 다른 열려 있는 서브 메뉴 닫기
        $('ul.sub_menu:visible').not($subMenu).slideUp();
        $('i.Sdown').show(); // 모든 Sdown 보이기
        $('i.Sup').hide(); // 모든 Sup 숨기기
        $('.gnb li>a').removeClass('active'); // 모든 gnb > li > a 에서 active 클래스 제거

        // 서브 메뉴 열기
        $subMenu.slideDown(); // 서브메뉴 열기
        $(this).hide(); // Sdown 숨기기
        $parentLi.find('i.Sup').show(); // Sup 보이기
        $gnbLink.addClass('active'); // 현재 gnb > li > a 에만 active 클래스 추가
    });

    // Sup 클릭 시 서브 메뉴 닫기
    $('i.Sup').click(function(e) {
        e.stopPropagation(); // 부모 클릭 이벤트 방지
        const $parentLi = $(this).closest('li');
        const $subMenu = $parentLi.find('ul.sub_menu');
        const $gnbLink = $parentLi.closest('li').children('a'); // gnb > li > a 선택

        // 서브 메뉴 닫기
        $subMenu.slideUp(); // 서브메뉴 닫기
        $(this).hide(); // Sup 숨기기
        $parentLi.find('i.Sdown').show(); // Sdown 보이기
        $gnbLink.removeClass('active'); // 현재 gnb > li > a 에서 active 클래스 제거
    });

});
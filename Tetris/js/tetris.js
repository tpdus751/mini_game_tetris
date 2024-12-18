import BLOCKS from "./blocks.js"; // 불러오기


// DOM
const playground = document.querySelector('.playground > ul') // playground안에 들어있는 ul
const gameText = document.querySelector('.game-text');
const scoreDisplay = document.querySelector('.score');
const restartButton = document.querySelector('.game-text > button'); // game-text안에 들어있는 button

// Setting
const GAME_ROWS = 20; // 행 수 정의
const GAME_COLS = 10; // 컬럼 수 정의

// variables
let score = 0; // 점수 초기 세팅
let duration = 500; // 떨어지는 시간
let downInterval; 
let tempMovingItem; // 무빙을 실질적으로 사용하기전에 잠깐 담아두는 용도?

const movingItem = { // 실질적으로 다음 블럭의 타입, 좌표의 정보를 담고있는 변수
    type: "",
    direction: 3, // 키보드 방향키를 눌렀을 때 좌우로 돌리는 지표
    top: 0, // 좌표 기준으로 어디까지 내려와있는지 어디까지 내려가야되는지 표현 역할
    left: 0 // 마찬가지로 좌우값을 알려주는 역할
} 

init() // 처음 렌더링 시 init 호출

// functions
function init() {
    tempMovingItem = { ...movingItem }; // spread operator(값 복사)를 통해서 담기 {...변수} => movingItem전체(주소?)를 가져오는 것이 아닌 movingItem 값만 가져옴 
                                        // 즉 movingItem의 값이 변경이 되더라도, tempMovingItem의 값은 변경이 되지 않도록 설계
                                        // 쓰는 이유는 주기적으로 바뀌는 tempMovingItem의 값이 안맞게 되면 원상복구를 시키기위해 임시로 저장하는 것?
    for (let i = 0; i < GAME_ROWS; i++) { // 행 수만큼 반복 (20번)
        prependNewLine();
    }
    generateNewBlock() // 랜덤한 블록 생성 및 시간에 따른 블록 아래로 이동
}

function prependNewLine() {
    const li = document.createElement("li"); // <li> 생성
    const ul = document.createElement("ul"); // <ul> 생성
    for (let j = 0; j < GAME_COLS; j++) { // 컬럼의 수만큼 반복 (10번)
        const matrix = document.createElement("li"); // <li> 생성
        ul.prepend(matrix); // ul에 <li> 10번 부여
    }
    li.prepend(ul) // li에 채워진 ul 부여
    playground.prepend(li) // playground에 채워진 li 부여
}

// blocks.js의 좌표에 맞는 모양대로 그려주는 역할의 함수 
function renderBlocks(moveType="") { // renderBlocks(), rederBlocks(moveType) 둘의 경우를 생각하여 그냥 moveType=""로 초기화
    const { type, direction, top, left } = tempMovingItem // distructuring을 사용해서 tempMovingItem안에 들어있는 properties을 하나씩 변수로 바로 사용
    const movingBlocks = document.querySelectorAll(".moving"); // moving 클래스를 가진 모든것들 불러오기
    movingBlocks.forEach(moving => { // 반복문
        moving.classList.remove(type, "moving") // type과, moving을 제거함으로써 css에 의해 빈값으로 변경
    })
    BLOCKS[type][direction].some(block=>{ // forEach를 돌리면 중간에 빈 값이 있으면 나머지 반복문을 break 시킬 수 없으므로 => some사용 하여 원하는 시점에 반복문을 중지 시키는 게 효율적 
        const x = block[0] + left; // x기본 값에 left 값을 이동
        const y = block[1] + top; // y기본 값에 top 값을 이동
        // playground의 childNodes(세로)의 0번째의 x 
        const target = playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null; // 삼항연사자 사용하여 변수에 담음 => playground.childNodes[y]가 null 즉, 최대 아래칸을 벗어날 경우
        const isAvailable = checkEmpty(target); // 가로 칸을 벗어나는 경우를 위함과 밑으로 떨어져 있는 블록이 있을 때 새로 생성된 블록이 밑에 블록과 닿는지 체크
        if (isAvailable) { // 가능한 상태이면
            target.classList.add(type, "moving") // target 칸들에게 type을 클래스로 부여, moving클래스도 부여하여 
        } else { // 가능하지 않은 상태라면
            tempMovingItem = { ...movingItem }; // tempMovingItem 값을 전 movigItem 상태로 원상복구 시키고 
            if(moveType === 'retry') { // 두 번째 빈공간이 작동될 때 moveType이 retry라면 
                clearInterval(downInterval) // interval을 멈추고
                showGameoverText(); // 게임 종료
            }
            // 재귀함수를 사용할 때 조심 : call stack maximum axid? 같은 에러가 발생할 수 있음 -> 방지하기 위해 이벤트루프 안에 넣지말고 외부로 빼놨다가 이벤트루프가 다 실행된 후에 task queue에 넣어놨다가 그것을 다시 실행할 수 있도록 setTimeout으로 바깥으로 잠시 빼놓음
            setTimeout(()=>{ // 잠시 옆으로 빼놨다가 위 실행후 다시 집어넣기 때문에 스택이 무한정으로 불러지는 현상을 방지하는 효과
                renderBlocks('retry'); // 렌더 후 retry값을 넘겨줌
                if (moveType === "top") { // 밑으로 떨어지는 움직임일 때 공간이 없으면 
                    seizeBlock(); // 블럭을 고정시켜버리는 함수 작동
                }
            }, 0)
            return true; // 빈 값이 있을경우 return true를 시킴으로 나머지 반복 탈출
        }
    })
    // 렌더가 성공할 때마다 movingItem의 값을 바꿔줌
    movingItem.left = left; 
    movingItem.top = top;
    movingItem.direction = direction;
}

// 블럭을 고정시켜버리는 함수
function seizeBlock() {
    const movingBlocks = document.querySelectorAll(".moving");
    movingBlocks.forEach(moving => {
        moving.classList.remove("moving") // 움직이는 moving 클래스 가진애들을 moving 클래스 제거
        moving.classList.add("seized") // 그 후 seized 클래스 추가하여
    })
    checkMatch() // 한 줄이 매칭되는 블록이 있는지 확인 함수 작동
}

// 한 줄이 매칭되는 블록이 있는지 확인 함수
function checkMatch() {

    const childNodes = playground.childNodes; // playground 전체 childNodes를 불러옴 
    childNodes.forEach(child=>{ // 그 childNodes 반복하여 
        let matched = true; // matched = true 로 초기화
        child.children[0].childNodes.forEach(li=>{ // child.children[0] : ul -> 의 childNodes를 반복 => li로 지정
            if(!li.classList.contains("seized")) { // li의 클래스 seized가 포함한게 없다고하면 줄이 완성이 안된 것으로 
                matched = false; 
            }
        })
        if (matched) {
            child.remove(); // 한 줄이 없어질 때마다 child 자체를 지우고
            prependNewLine(); // 한 줄 생성되게끔 (없어짐과 동시에 맨 위에 한 줄이 추가되는 원리)
            score++; // 한 줄 매치 시 스코어 1점씩 증가
            scoreDisplay.innerText = score; // 스코어를 업데이트
        }
    })

    generateNewBlock();
}

// 랜덤한 블록 생성 및 시간에 따른 블록 아래로 이동
function generateNewBlock() {

    clearInterval(downInterval); // 진행되고 있는 Interval을 off
    downInterval = setInterval(()=>{
        moveBlock('top', 1) // 아래로 1씩 이동
    }, duration) // 처음 정의한 500

    const blockArray = Object.entries(BLOCKS) // BLOCKS는 Object이기 때문에 Object.entries() 사용
    const randomIndex = Math.floor(Math.random() * blockArray.length) // 랜덤 함수를 사용하여 랜덤 값 1 ~ BLOCKS의 개수 만큼 추출 => Math.floor를 사용하여 소수점 제거 => 랜덤 인덱스 추출
    movingItem.type = blockArray[randomIndex][0] // blockArray의 랜덤 인덱스의 0번째 => 즉, 해당 인덱스의 블록 이름 추출하여 type에 적용
    movingItem.top = 0; // 새로운 블록 위치 초기화 : 맨 윗줄
    movingItem.left = 3; // 새로운 블록 위치 초기화 : x좌표 중간
    movingItem.direction = 0; // 0번째 모양변화 초기화
    tempMovingItem = { ...movingItem }; // 다시 한번 복사
    renderBlocks(); // 블럭 렌더링
}

// 가로 칸을 벗어나는 경우를 위함과 밑으로 떨어져 있는 블록이 있을 때 새로 생성된 블록이 밑에 블록과 닿는지 체크 
function checkEmpty(target) {
    if(!target || target.classList.contains("seized")) { // target이 없거나 seized 클래스가 있으면 
        return false; // 불가능 리턴
    }
    return true; // 가능 리턴
}

// 블록 이동 함수(움직일 방향, 움직이는 정도)
function moveBlock(moveType, amount) { 
    tempMovingItem[moveType] += amount; // tempMovingItem의 moveType(left or top)을 움직이는 정도 만큼 더해서 바꾸어줌
    renderBlocks(moveType)  // moveBlock일 때만 renderBlocks에 moveType을 보냄
}

// 모양 변화시킴
function changeDirection() {
    const direction = tempMovingItem.direction; // 변수화
    direction === 3 ? tempMovingItem.direction = 0 : tempMovingItem.direction += 1; // direction이 3이면 0으로 초기화, 그게 아니면 1씩 증가시켜줌
    renderBlocks() // 블록 렌더링
}

// 아래로 빠르게 이동 시키는 함수
function dropBlock() {
    clearInterval(downInterval); // 현재 돌아가는 interval을 잠시 off
    downInterval = setInterval(()=>{
        moveBlock("top", 1)
    }, 10) // 10 : 엄청 빠른 속도로 내려올 수 있도록 설정
}

// 게임 종료
function showGameoverText() {
    gameText.style.display = "flex"; // 게임이 종료가 되면 display:none => display.flex로 변경 
}

// event handling
document.addEventListener("keydown", e=>{ // 키를 눌렀을 때 이벤트, e는 키를 눌렀을 때의 이벤트 객체
    switch(e.keyCode) { // 각각의 키에 맞는 키코드
        case 39: // 오른쪽 방향키
            moveBlock("left", 1); // 오른쪽 이동
            break;
        case 37: // 왼쪽 방향키
            moveBlock("left", -1); // 왼쪽 이동
            break;
        case 40: // 아래 방향키
            moveBlock("top", 1); // 아래로 이동
            break;
        case 38: // 위 방향키 : direction을 바꾸는 방향키
            changeDirection(); // direction에 따른 모양 변화시킴
            break;
        case 32: // 스페이스바 
            dropBlock(); // 아래로 빠르게 이동 시키는 함수 작동
            break;
        default :
            break;
    }
    //console.log(e)
})

// 다시하기 버튼 클릭 시
restartButton.addEventListener("click", ()=>{
    playground.innerHTML = ""; // 초기화
    gameText.style.display = "none" // 다시 display.none 처리
    init(); // 재시작
})

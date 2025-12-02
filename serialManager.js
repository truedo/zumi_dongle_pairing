// serialManager.js
document.addEventListener('DOMContentLoaded', () => {
    let port;
    let reader;
    let readLoopActive = false;

    // DOM 요소 캐싱
    const elements = {
        statusLabel: document.getElementById('statusLabel'),
        //portSelect: document.getElementById('portSelect'),
        connectBtn: document.getElementById('connectBtn'),
        deviceLabel: document.getElementById('deviceLabel'),
        pairBtn: document.getElementById('pairBtn'),
        testBtn: document.getElementById('testBtn'),
        textOutput: document.getElementById('textOutput'),
        disconnectBtn: document.getElementById('disconnectBtn')
    };

    // 포트 새로고침 기능
    // async function refreshPorts() {
    //     const ports = await navigator.serial.getPorts();
    //     elements.portSelect.innerHTML = ports.map(p =>
    //         `<option value="${p.getInfo().usbVendorId}">${p.getInfo().usbProductId}</option>`
    //     ).join('');
    // }

    // 데이터 수신 처리
    async function readSerial() {
        elements.textOutput.display ='none';
        reader = port.readable.getReader();
        readLoopActive = true;
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const decoder = new TextDecoder();
                const text = decoder.decode(value);
                elements.textOutput.value += text + '\n';
                parsePairingInfo(text);
            }
        } catch (error) {
            console.error('Read error:', error);
        } finally {
            reader.releaseLock();
            readLoopActive = false;
        }
    }

    // // 페어링 정보 파싱
    // function parsePairingInfo(text) {
    //     const match = text.match(/namezumi-\d{4}/);
    //     if (match) {
    //         const result = match[0].substring(9);
    //         elements.deviceLabel.textContent = `페어링 완료: zumi-${result}`;
    //         elements.deviceLabel.style.color = '#32CD32';
    //     }
    // }

    // 페어링 정보 파싱
    function parsePairingInfo(text) {
        // Zumi ID 파싱: "namezumi-xxxx" 패턴 찾기
        const zumiMatch = text.match(/namezumi-(\d{4})/);

        // 채널 정보 파싱: "CH:xx" 패턴 찾기 (CH: 뒤에 2개의 16진수 문자)
        // 예를 들어, "MY destMAC Address: 80:65:99:A3:34:A8 CH:0C"에서 "0C"를 찾습니다.
        const channelMatch = text.match(/CH:([0-9A-Fa-f]{2})/);

        let outputText = '';

        if (zumiMatch) {
            const zumiId = zumiMatch[1]; // zumiMatch[0]은 전체 매칭 문자열, [1]은 캡처 그룹(\d{4})
            outputText += `페어링 완료: zumi-${zumiId}`;
            elements.deviceLabel.style.color = '#32CD32'; // 연결 성공 색상으로 변경
      //  }

       // if (channelMatch) {
            const hexChannel = channelMatch[1].toUpperCase(); // 16진수 채널 값 (예: "0C")
            const channel = parseInt(hexChannel, 16); // "0C" -> 12

            // zumiMatch가 성공했든 안 했든 채널 정보가 있으면 출력에 추가
            if (outputText) {
                outputText += ` 채널: ${channel}`;
            } else {
                 // Zumi ID가 파싱되지 않았는데 채널만 파싱된 경우
                 outputText = `채널 정보 수신: **${channel}**`;
            }

            elements.deviceLabel.textContent = outputText;
        } else if (zumiMatch) {
             // Zumi ID는 파싱되었으나 채널은 파싱되지 않은 경우
             elements.deviceLabel.textContent = outputText;
        }
    }

    // 이벤트 리스너 설정
    function initEventListeners() {
        elements.connectBtn.addEventListener('click', handleConnect);
        elements.pairBtn.addEventListener('click', handlePairing);
        elements.testBtn.addEventListener('click', handleTest);
        elements.disconnectBtn.addEventListener('click', handleDisconnect);
    }

    // 연결 핸들러
    async function handleConnect() {

        if (port) {
            if (readLoopActive) await reader.cancel();
            await port.close();
            elements.connectBtn.disabled = false;
        }

        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });

            updateUIOnConnect();
            readSerial();
        } catch (error) {
            console.error('Connection error:', error);
            elements.statusLabel.textContent = '상태: 연결 실패';
            port = null; // 연결 실패 시 포트 변수 초기화
        }
    }

    // UI 상태 업데이트 (연결시)
    function updateUIOnConnect() {
       //elements.statusLabel.textContent = `상태: ${port.getInfo().usbProductId} 연결됨`;
        elements.statusLabel.textContent = `상태: 연결됨`;
        elements.statusLabel.style.color = '#32CD32';
        elements.connectBtn.disabled = true;
       //elements.portSelect.disabled = true;
    }

    // 데이터 전송 공통 함수
    async function sendData(data) {
        const writer = port.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
    }

    // 페어링 핸들러
    function handlePairing() {
        const btnPress = new Uint8Array([0x24, 0x52, 0xCD, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF]);
        sendData(btnPress);
    }

    // 테스트 핸들러
    function handleTest() {
        const hello = new Uint8Array([0x24, 0x52, 0x01, 0x48, 0x45, 0x4C, 0x4C, 0x4F, 0x21, 0xFF, 0xFF]);
        sendData(hello);
    }

    // 연결 해제 핸들러
    async function handleDisconnect() {
        if (port) {
            if (readLoopActive) await reader.cancel();
            await port.close();
            port = null; // 연결 실패 시 포트 변수 초기화
            resetUIOnDisconnect();
        }
    }

    // UI 상태 리셋 (연결 해제시)
    function resetUIOnDisconnect() {
        elements.statusLabel.textContent = '상태: 연결 끊김';
        elements.connectBtn.disabled = false;
       // elements.portSelect.disabled = false;
        elements.statusLabel.style.color = '#000000';

        elements.deviceLabel.textContent = `페어링 상태`;
        elements.deviceLabel.style.color = '#000000';


    }

    // 초기화
    function init() {
       // refreshPorts();
        initEventListeners();
    }

    init();
});
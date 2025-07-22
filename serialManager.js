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

    // 페어링 정보 파싱
    function parsePairingInfo(text) {
        const match = text.match(/namezumi-\d{4}/);
        if (match) {
            const result = match[0].substring(9);
            elements.deviceLabel.textContent = `페어링 완료: zumi-${result}`;
            elements.deviceLabel.style.color = '#32CD32';
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
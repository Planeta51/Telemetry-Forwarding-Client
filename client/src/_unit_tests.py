""" Unit tests """

import unittest
import os
import sqlite3
from datetime import datetime
from db_interface import TelemetryDB
from conf import Configuration
from ax_listener import AXListener, AXFrame


class UnitTest(unittest.TestCase):

    testConf = """\
[Client]
database=../db
frontend-port=5000
"""
    writtenConf = """\
[Client]
database=../db
frontend-port=5000
static-files-path=../static
"""

    confPath = os.path.join(os.path.dirname(__file__), "__test__", "conf.ini")
    dbPath = os.path.join(os.path.dirname(__file__), "__test__", "test.db")

    axPacket = b"""~\x8a\xa6j\x8a@@`\x8a\xa6j\x8a\x86@a\x03\xf0\x00\x00\x00\x01\x00q?GmN2dzpYLYwjaf\
RIg30bY;BJ:K/JyOUu1tVqkch\\TN>dx~"""
    infoArr = bytearray.fromhex("""0000000100713f476d4e32647a70594c59776a61665249673\
                33062593b424a3a4b2f4a794f5575317456716b63685c544e3e""".replace(" ", ""))

    # Tests if a packet is correctly stored in AXFrame by sending a packet and checking if current date is saved
    def test_AXListener_addresses(self):
        listener = AXListener()
        def assertDestAndSrc(frame: AXFrame):
            self.assertEqual(frame.dest, "ES5E  ", "Frame destination is decoded incorrectly.")
            self.assertEqual(frame.source, "ES5EC ", "Frame source is decoded incorrectly.")
        listener.add_callback(assertDestAndSrc)
        listener.receive(bytearray(self.axPacket))

    def test_AXListener_control(self):
        listener = AXListener()
        def assertControlByte(frame: AXFrame):
            self.assertEqual(frame.ctrl, 3)
        listener.add_callback(assertControlByte)
        listener.receive(bytearray(self.axPacket))

    def test_AXListener_pid(self):
        listener = AXListener()
        def assertPID(frame: AXFrame):
            self.assertEqual(frame.pid, 240)
        listener.add_callback(assertPID)
        listener.receive(bytearray(self.axPacket))

    def test_AXListener_info(self):
        listener = AXListener()
        def assertControlByte(frame: AXFrame):
            self.assertEqual(frame.info, self.infoArr, "\nframe: {}\ntest: {}".format(
                frame.info, self.infoArr))
        listener.add_callback(assertControlByte)
        listener.receive(bytearray(self.axPacket))

    def test_Configuration_read_test(self):
        f = open(self.confPath, 'w', encoding="utf-8")
        f.write(self.testConf)
        f.close()

        conf = Configuration(self.confPath)
        self.assertEqual(conf.get_conf("Client", "database"), "../db")
        self.assertEqual(conf.get_conf("Client", "frontend-port"), "5000")

        os.remove(self.confPath)

    # Tests if set_conf method changes the values in the conf file.
    def test_Configuration_write_test(self):
        f = open(self.confPath, 'w', encoding="utf-8")
        f.write(self.testConf)
        f.close()

        conf = Configuration(self.confPath)
        conf.set_conf("Client", "frontend-port", 4700)
        conf.set_conf("Client", "static-files-path", "../static")

        f = open(self.confPath, 'r', encoding="utf-8")
        content = f.read()
        f.close()
        self.assertNotEqual(content, self.writtenConf)

        os.remove(self.confPath)

    # Tests if an AXFame is correctly stored in the DB.
    def test_DB_test(self):
        database = TelemetryDB(self.dbPath)
        database.init_db()

        ts = datetime.now()
        frame = AXFrame(None, None, None, None, None, None, None, bytearray(self.axPacket), ts)

        database.insert_ax_frame(frame)

        # Placeholder assert since querying DB is not implemented
        conn = sqlite3.connect(self.dbPath)
        cur = conn.cursor()
        cur.execute("select time, data from ax_frame order by time desc limit 1")
        time, data = cur.fetchone()

        self.assertEqual(time, ts.isoformat())
        self.assertEqual(data, self.axPacket)

        os.remove(self.dbPath)


if __name__ == '__main__':
    os.mkdir(os.path.join(os.path.dirname(__file__), "__test__"))
    unittest.main()
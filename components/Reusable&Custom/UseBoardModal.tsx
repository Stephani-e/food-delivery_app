import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Board } from "@/type";

interface UseBoardModalProps {
    visible: boolean;
    boards: Board[];
    onClose: () => void;
    onUseBoard: (board: Board) => void;
}

const UseBoardModal: React.FC<UseBoardModalProps> = ({ visible, boards, onClose, onUseBoard }) => {

    const activeBoards = boards.filter(b => b.isActive);
    const usedBoards = boards.filter(b => !b.isActive && !b.archived);
    const pastBoards = boards.filter(b => !b.isActive && b.archived);

    const renderBoard = (board: Board) => (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 5,
                padding: 10,
                borderBottomWidth: 1,
                borderColor: '#eee',
                opacity: board.isActive ? 1 : 0.6, // dim inactive boards
            }}
        >
            <Text> {board.name} </Text>
            <TouchableOpacity
                onPress={() => onUseBoard(board)}
                style={{
                    backgroundColor: board.isActive ? '#F89D3A' : '#999',
                    paddingHorizontal: 5,
                    paddingVertical: 5,
                    borderRadius: 5,
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {board.isActive ? 'Use' : board.archived ? 'Archived' : 'Reuse'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} animationType='slide' transparent={true}>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                padding: 20
            }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, maxHeight: '85%' }}>
                    <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 15 }}>Your Boards</Text>

                    {activeBoards.length > 0 && (
                        <>
                            <Text style={{ fontWeight: '600', marginBottom: 5 }}> Active Boards </Text>
                            <FlatList
                                data={activeBoards}
                                keyExtractor={b => b.$id}
                                renderItem={({ item }) => renderBoard(item)}
                            />
                        </>
                    )}

                    {usedBoards.length > 0 && (
                        <>
                            <Text style={{ fontWeight: '600', marginTop: 25, marginBottom: 5 }}> Used Boards </Text>
                            <FlatList
                                data={usedBoards}
                                keyExtractor={b => b.$id}
                                renderItem={({ item }) => renderBoard(item)}
                            />
                        </>
                    )}

                    {pastBoards.length > 0 && (
                        <>
                            <Text style={{ fontWeight: '600', marginTop: 35, marginBottom: 5 }}> Past Boards </Text>
                            <FlatList
                                data={pastBoards}
                                keyExtractor={b => b.$id}
                                renderItem={({ item }) => renderBoard(item)}
                            />
                        </>
                    )}

                    {boards.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>
                            No boards found
                        </Text>
                    )}
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ marginTop: 10, alignItems: 'center' }}
                    >
                        <Text style={{ color: "#777" }}> Close </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default UseBoardModal;
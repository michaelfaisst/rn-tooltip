import React, { useEffect, useRef, useState } from "react";
import {
	TouchableOpacity,
	Modal,
	View,
	I18nManager,
	ViewStyle
} from "react-native";

import Triangle from "./Triangle";
import { ScreenWidth, ScreenHeight, isIOS } from "./helpers";
import getTooltipCoordinate from "./getTooltipCoordinate";

type ActionType = "press" | "longPress" | "none";

interface IProps {
	children: React.ReactNode;
	withPointer?: boolean;
	popover: React.ReactNode;
	height?: number | string;
	width?: number | string;
	containerStyle?: ViewStyle;
	pointerColor?: string;
	pointerStyle?: ViewStyle;
	onClose?: () => void;
	onOpen?: () => void;
	withOverlay?: boolean;
	overlayColor?: string;
	backgroundColor?: string;
	highlightColor?: string;
	toggleWrapperProps?: {};
	actionType?: ActionType;
}

const Tooltip = (props: IProps) => {
	const {
		children,
		withPointer = true,
		popover,
		height = 40,
		width = 150,
		containerStyle = {},
		pointerColor,
		pointerStyle = {},
		onClose = () => {},
		onOpen = () => {},
		withOverlay = true,
		overlayColor,
		backgroundColor = "#617080",
		highlightColor = "transparent",
		toggleWrapperProps = {},
		actionType = "press"
	} = props;

	const [isVisible, setIsVisible] = useState(false);

	const [renderedElementLayout, setRenderedElementLayout] = useState({
		yOffset: 0,
		xOffset: 0,
		elementWidth: 0,
		elementHeight: 0
	});

	const renderedElementRef = useRef<View>(null);

	const getElementPosition = () => {
		if (!renderedElementRef || !renderedElementRef.current) {
			return;
		}

		renderedElementRef.current.measureInWindow(
			(pageOffsetX, pageOffsetY, width, height) => {
				setRenderedElementLayout({
					xOffset: pageOffsetX,
					yOffset: pageOffsetY,
					elementWidth: width,
					elementHeight: height
				});
			}
		);
	};

	useEffect(() => {
		const timeout = setTimeout(getElementPosition, 500);

		return () => {
			clearTimeout(timeout);
		};
	}, []);

	const toggleTooltip = () => {
		getElementPosition();

		if (isVisible && !isIOS) {
			onClose();
		}

		setIsVisible(!isVisible);
	};

	const wrapWithAction = (
		actionType: ActionType,
		children: React.ReactNode
	) => {
		switch (actionType) {
			case "press":
				return (
					<TouchableOpacity
						onPress={toggleTooltip}
						activeOpacity={1}
						{...toggleWrapperProps}
					>
						{children}
					</TouchableOpacity>
				);
			case "longPress":
				return (
					<TouchableOpacity
						onLongPress={toggleTooltip}
						activeOpacity={1}
						{...toggleWrapperProps}
					>
						{children}
					</TouchableOpacity>
				);
			default:
				return children;
		}
	};

	const getTooltipStyle = () => {
		const { x, y } = getTooltipCoordinate(
			renderedElementLayout.xOffset,
			renderedElementLayout.yOffset,
			renderedElementLayout.elementWidth,
			renderedElementLayout.elementHeight,
			ScreenWidth,
			ScreenHeight,
			width,
			withPointer
		);

		let tooltipStyle: ViewStyle = {
			position: "absolute",
			left: I18nManager.isRTL ? undefined : x,
			right: I18nManager.isRTL ? x : undefined,
			width,
			height,
			backgroundColor,
			// default styles
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			flex: 1,
			borderRadius: 10,
			padding: 10,
			...containerStyle
		};

		const pastMiddleLine = renderedElementLayout.yOffset > y;
		if (typeof height !== "number" && pastMiddleLine) {
			tooltipStyle.bottom = ScreenHeight - y;
		} else if (typeof height === "number" && pastMiddleLine) {
			tooltipStyle.top = y - height;
		} else {
			tooltipStyle.top = y;
		}

		return { tooltipStyle, pastMiddleLine };
	};

	const renderPointer = (pastMiddleLine: boolean) => {
		const {
			yOffset,
			xOffset,
			elementHeight,
			elementWidth
		} = renderedElementLayout;

		return (
			<View
				style={{
					position: "absolute",
					top: pastMiddleLine
						? yOffset - 13
						: yOffset + elementHeight - 2,
					left: I18nManager.isRTL
						? undefined
						: xOffset + elementWidth / 2 - 7.5,
					right: I18nManager.isRTL
						? xOffset + elementWidth / 2 - 7.5
						: undefined
				}}
			>
				<Triangle
					style={{
						borderBottomColor: pointerColor || backgroundColor,
						...pointerStyle
					}}
					isDown={pastMiddleLine}
				/>
			</View>
		);
	};

	const renderContent = (withTooltip: boolean) => {
		if (!withTooltip) return wrapWithAction(actionType, children);

		const {
			yOffset,
			xOffset,
			elementWidth,
			elementHeight
		} = renderedElementLayout;
		const { pastMiddleLine, tooltipStyle } = getTooltipStyle();

		return (
			<>
				<View
					style={{
						position: "absolute",
						top: yOffset,
						left: I18nManager.isRTL ? undefined : xOffset,
						right: I18nManager.isRTL ? xOffset : undefined,
						backgroundColor: highlightColor,
						overflow: "visible",
						width: elementWidth,
						height: elementHeight
					}}
				>
					{children}
				</View>
				{withPointer && renderPointer(pastMiddleLine)}
				<View style={tooltipStyle}>{popover}</View>
			</>
		);
	};

	return (
		<View collapsable={false} ref={renderedElementRef}>
			{renderContent(false)}
			<Modal
				animationType="fade"
				visible={isVisible}
				transparent
				onDismiss={onClose}
				onShow={onOpen}
				onRequestClose={onClose}
			>
				<TouchableOpacity
					style={styles.container(withOverlay, overlayColor)}
					onPress={toggleTooltip}
					activeOpacity={1}
				>
					{renderContent(true)}
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

const styles = {
	container: (withOverlay: boolean, overlayColor?: string) => ({
		backgroundColor: withOverlay
			? overlayColor
				? overlayColor
				: "rgba(250, 250, 250, 0.70)"
			: "transparent",
		flex: 1
	})
};

export default Tooltip;
